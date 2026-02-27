package com.workshop.backend.controller;

import com.workshop.backend.dto.FraudPredictionDto;
import com.workshop.backend.dto.TransactionDto;
import com.workshop.backend.mapper.TransactionMapper;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate;
    private final TransactionMapper transactionMapper;

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
     * GET high-risk transactions for alerts page
     * Used by: HighRiskAlertsComponent
     */
    @GetMapping("/high-risk")
    public ResponseEntity<List<Transaction>> getHighRiskTransactions() {
        return ResponseEntity.ok(transactionRepository.findByRiskScoreGreaterThanEqual(0.7));
    }

    /**
     * GET dashboard statistics
     * Used by: DashboardComponent stats cards
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        // 3 queries aligned with frontend getRiskLevel thresholds (HIGH >= 0.7, MEDIUM >= 0.4)
        long total        = transactionRepository.count();
        long mediumAndUp  = transactionRepository.countByRiskScoreGreaterThanEqual(0.4);
        long highAndUp    = transactionRepository.countByRiskScoreGreaterThanEqual(0.7);
        long critical     = transactionRepository.countByRiskScoreGreaterThanEqual(0.9);

        Map<String, Object> stats = Map.of(
            "total",      total,
            "lowRisk",    total - mediumAndUp,
            "mediumRisk", mediumAndUp - highAndUp,
            "highRisk",   highAndUp - critical,
            "critical",   critical,
            "flagged",    highAndUp,
            "blocked",    critical
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
        
        transaction.setStatus(status);
        transaction.setIsFraud("APPROVED".equals(status) ? 0 : 1);
        transaction.setReviewedBy(authentication.getName());
        transaction.setReviewedAt(LocalDateTime.now());
        Transaction updated = transactionRepository.save(transaction);
        
        return ResponseEntity.ok(updated);
    }

    /**
     * POST new transaction with fraud detection
     */
    @PostMapping("/fraud-check")
    public ResponseEntity<Transaction> createTransactionWithFraudCheck(@RequestBody TransactionDto dto) {
        try {
            // Fetch user's historical transactions from DB
            List<Transaction> history = transactionRepository.findByCcNumberOrderByTimestampAsc(dto.getCcNumber());
            List<Map<String, Object>> historyList = history.stream().map(t -> {
                Map<String, Object> m = new HashMap<>();
                m.put("amount", t.getAmount());
                m.put("timestamp", t.getTimestamp().toString());
                m.put("latitude", t.getLatitude() != null ? t.getLatitude() : 0.0);
                m.put("longitude", t.getLongitude() != null ? t.getLongitude() : 0.0);
                m.put("merchant", t.getMerchant() != null ? t.getMerchant() : "");
                return m;
            }).toList();

            Map<String, Object> payload = new HashMap<>();
            payload.put("transaction", dto);
            payload.put("history", historyList);

            FraudPredictionDto fraudResponse = restTemplate.postForObject(
                "http://localhost:8000/predict", payload, FraudPredictionDto.class);

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
            }
            txn.setRiskScore(fraudProb);
            txn.setStatus(fraudProb >= 0.70 ? TransactionStatus.BLOCKED : fraudProb >= 0.40 ? TransactionStatus.FLAGGED : TransactionStatus.APPROVED);

            return new ResponseEntity<>(transactionRepository.save(txn), HttpStatus.CREATED);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fraud detection failed: " + e.getMessage());
        }
    }
}
