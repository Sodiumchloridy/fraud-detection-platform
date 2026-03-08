package com.workshop.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import org.springframework.security.core.Authentication;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.workshop.backend.config.ThresholdConfig;
import com.workshop.backend.dto.FraudPredictionResponse;
import com.workshop.backend.dto.TransactionRequest;
import com.workshop.backend.mapper.TransactionMapper;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.repository.TransactionRepository;
import com.workshop.backend.enums.TransactionStatus;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate;
    private final TransactionMapper transactionMapper;
    private final ObjectMapper objectMapper;
    private final ThresholdConfig thresholdConfig;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable UUID id) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found with id: " + id));
        return ResponseEntity.ok(transaction);
    }

    /**
     * GET flagged transactions for alerts page
     * Used by: FlaggedTransactionsComponent
     */
    @GetMapping("/flagged")
    public ResponseEntity<List<Transaction>> getFlaggedTransactions() {
        return ResponseEntity.ok(transactionRepository.findByRiskScoreGreaterThanEqualAndRiskScoreLessThan(
            thresholdConfig.getFlaggedThreshold(), thresholdConfig.getBlockedThreshold()));
    }

    /**
     * GET dashboard statistics
     * Used by: DashboardComponent stats cards
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        long total    = transactionRepository.count();
        long flagged  = transactionRepository.countByRiskScoreGreaterThanEqual(thresholdConfig.getFlaggedThreshold());
        long blocked  = transactionRepository.countByRiskScoreGreaterThanEqual(thresholdConfig.getBlockedThreshold());

        Map<String, Object> stats = Map.of(
            "total",    total,
            "approved", total - flagged,
            "flagged",  flagged - blocked,
            "blocked",  blocked
        );

        return ResponseEntity.ok(stats);
    }

    /**
     * PATCH to update transaction status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Transaction> updateTransactionStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            Authentication authentication) {
        
        // CRUD - Read and Update
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found with id: " + id));
        
        TransactionStatus txnStatus = TransactionStatus.valueOf(status.toUpperCase());
        transaction.setStatus(txnStatus);
        transaction.setIsFraud(TransactionStatus.APPROVED.equals(txnStatus) ? 0 : 1);
        transaction.setReviewedBy(authentication.getName());
        transaction.setReviewedAt(LocalDateTime.now());
        Transaction updated = transactionRepository.save(transaction);
        
        return ResponseEntity.ok(updated);
    }

    /**
     * POST new transaction with fraud detection
     */
    @PostMapping("/fraud-check")
    public ResponseEntity<Transaction> createTransactionWithFraudCheck(@RequestBody TransactionRequest dto) {
        try {
            // Fetch user's historical transactions from DB
            List<Transaction> history = transactionRepository.findByCcNumberOrderByTimestampAsc(dto.getCcNumber());

            // Serialize full entities — new fields automatically flow through
            List<Map<String, Object>> historyList = history.stream()
                .map(t -> objectMapper.convertValue(t, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}))
                .toList();

            Map<String, Object> payload = new HashMap<>();
            payload.put("transaction", dto);
            payload.put("history", historyList);

            FraudPredictionResponse fraudResponse = restTemplate.postForObject(
                "http://localhost:8000/predict", payload, FraudPredictionResponse.class);

            // Create transaction from DTO fields
            Transaction txn = transactionMapper.toTransaction(dto);
            txn.setTimestamp(dto.getTimestamp() != null
                    ? LocalDateTime.ofInstant(Instant.parse(dto.getTimestamp()), ZoneId.systemDefault())
                    : LocalDateTime.now());
            txn.setMerchant(dto.getMerchant() != null ? dto.getMerchant() : "");
            txn.setChannel(dto.getChannel() != null ? dto.getChannel() : "in_store");

            // Apply computed fraud features onto the transaction
            double fraudProb = 0.5;
            if (fraudResponse != null) {
                fraudProb = fraudResponse.getFraudProbability();
                transactionMapper.applyFeatures(fraudResponse.getFeatures(), txn);
                if (fraudResponse.getShap() != null) {
                    txn.setShapJson(objectMapper.writeValueAsString(fraudResponse.getShap()));
                }
            }
            txn.setRiskScore(fraudProb);
            txn.setStatus(fraudProb >= thresholdConfig.getBlockedThreshold() ? TransactionStatus.BLOCKED
                    : fraudProb >= thresholdConfig.getFlaggedThreshold() ? TransactionStatus.FLAGGED
                    : TransactionStatus.APPROVED);

            return new ResponseEntity<>(transactionRepository.save(txn), HttpStatus.CREATED);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fraud detection failed: " + e.getMessage());
        }
    }
}
