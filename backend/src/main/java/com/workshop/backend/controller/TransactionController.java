package com.workshop.backend.controller;

import com.workshop.backend.dto.FraudPredictionDto;
import com.workshop.backend.dto.TransactionDto;
import com.workshop.backend.mapper.TransactionMapper;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:4200")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private TransactionMapper transactionMapper;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = transactionRepository.findAll();
        return ResponseEntity.ok(transactions);
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
        List<Transaction> highRisk = transactionRepository.findByRiskScoreGreaterThanEqual(0.7);
        return ResponseEntity.ok(highRisk);
    }

    /**
     * GET dashboard statistics
     * Used by: DashboardComponent stats cards
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Aggregate queries
        long totalCount = transactionRepository.count();
        long lowCount = transactionRepository.countByRiskScoreGreaterThanEqual(0.0) 
                      - transactionRepository.countByRiskScoreGreaterThanEqual(0.3);
        long mediumCount = transactionRepository.countByRiskScoreGreaterThanEqual(0.3)
                         - transactionRepository.countByRiskScoreGreaterThanEqual(0.6);
        long highCount = transactionRepository.countByRiskScoreGreaterThanEqual(0.6)
                       - transactionRepository.countByRiskScoreGreaterThanEqual(0.8);
        long criticalCount = transactionRepository.countByRiskScoreGreaterThanEqual(0.8);
        
        stats.put("total", totalCount);
        stats.put("lowRisk", lowCount);
        stats.put("mediumRisk", mediumCount);
        stats.put("highRisk", highCount);
        stats.put("critical", criticalCount);
        stats.put("flagged", highCount + criticalCount);
        stats.put("blocked", criticalCount);
        
        return ResponseEntity.ok(stats);
    }

    /**
     * PATCH to update transaction status
     * Used by: TransactionDetailsComponent (mark as legitimate/fraud)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Transaction> updateTransactionStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        
        // CRUD - Read and Update
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found with id: " + id));
        
        transaction.setStatus(status);
        Transaction updated = transactionRepository.save(transaction);
        
        return ResponseEntity.ok(updated);
    }

    /**
     * POST new transaction with fraud detection
     */
    @PostMapping("/fraud-check")
    public ResponseEntity<Transaction> createTransactionWithFraudCheck(@RequestBody TransactionDto dto) {
        try {
            FraudPredictionDto fraudResponse = restTemplate.postForObject(
                "http://localhost:8000/predict", dto, FraudPredictionDto.class);

            // Create transaction from DTO fields
            Transaction txn = transactionMapper.toTransaction(dto);
            txn.setTimestamp(LocalDateTime.now());

            // Required columns (avoid null constraint violations)
            txn.setMerchant(dto.getMerchant() != null ? dto.getMerchant() : "");
            txn.setChannel(dto.getChannel() != null ? dto.getChannel() : "in_store");

            // Apply computed fraud features onto the transaction
            double fraudProb = 0.5;
            if (fraudResponse != null) {
                fraudProb = fraudResponse.getFraudProbability();
                transactionMapper.applyFeatures(fraudResponse.getFeatures(), txn);
            }
            txn.setRiskScore(fraudProb);
            
            if (fraudProb >= 0.70) {
                txn.setStatus("BLOCKED");
            } else if (fraudProb >= 0.40) {
                txn.setStatus("FLAGGED");
            } else {
                txn.setStatus("APPROVED");
            }

            return new ResponseEntity<>(transactionRepository.save(txn), HttpStatus.CREATED);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fraud detection failed: " + e.getMessage());
        }
    }
}
