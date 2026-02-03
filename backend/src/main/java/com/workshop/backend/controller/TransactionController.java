package com.workshop.backend.controller;

import com.workshop.backend.dto.TransactionDto;
import com.workshop.backend.exception.InvalidRequestException;
import com.workshop.backend.exception.ResourceNotFoundException;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.model.Transaction.RiskLevel;
import com.workshop.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:4200")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = transactionRepository.findAll();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
        return ResponseEntity.ok(transaction);
    }

    /**
     * GET high-risk transactions for alerts page
     * Used by: HighRiskAlertsComponent
     */
    @GetMapping("/high-risk")
    public ResponseEntity<List<Transaction>> getHighRiskTransactions() {
        // Derived query - finds HIGH and CRITICAL risk transactions
        List<Transaction> highRisk = transactionRepository.findByRiskLevelIn(
            List.of(RiskLevel.HIGH, RiskLevel.CRITICAL)
        );
        return ResponseEntity.ok(highRisk);
    }

    /**
     * GET dashboard statistics
     * Used by: DashboardComponent stats cards
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // JPQL aggregate queries
        long totalCount = transactionRepository.count();
        long lowCount = transactionRepository.countByRiskLevel(RiskLevel.LOW);
        long mediumCount = transactionRepository.countByRiskLevel(RiskLevel.MEDIUM);
        long highCount = transactionRepository.countByRiskLevel(RiskLevel.HIGH);
        long criticalCount = transactionRepository.countByRiskLevel(RiskLevel.CRITICAL);
        
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
     * POST to create new transaction
     * Used by: Dashboard for adding new transactions
     */
    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestBody Transaction transaction) {
        // Input validation
        if (transaction.getAmount() == null || transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("Transaction amount must be greater than zero");
        }
        if (transaction.getType() == null || transaction.getType().trim().isEmpty()) {
            throw new InvalidRequestException("Transaction type is required");
        }
        
        // Set timestamp if not provided
        if (transaction.getTimestamp() == null) {
            transaction.setTimestamp(LocalDateTime.now());
        }
        
        // CRUD - Create
        Transaction savedTransaction = transactionRepository.save(transaction);
        return new ResponseEntity<>(savedTransaction, HttpStatus.CREATED);
    }

    /**
     * PATCH to update transaction status
     * Used by: TransactionDetailsComponent (mark as legitimate/fraud)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Transaction> updateTransactionStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        
        // CRUD - Read and Update
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
        
        transaction.setStatus(status);
        Transaction updated = transactionRepository.save(transaction);
        
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE transaction
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTransaction(@PathVariable Long id) {
        // Check existence before delete
        if (!transactionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Transaction", id);
        }
        
        // CRUD - Delete
        transactionRepository.deleteById(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Transaction deleted successfully");
        response.put("id", id.toString());
        
        return ResponseEntity.ok(response);
    }

    /**
     * POST new transaction with fraud detection
     */
    @PostMapping("/fraud-check")
    public ResponseEntity<Transaction> createTransactionWithFraudCheck(@RequestBody TransactionDto dto) {
        try {
            // Call Python fraud detection
            Map<String, Object> fraudResponse = restTemplate.postForObject(
                "http://localhost:8000/predict", dto, Map.class);

            // Create transaction
            Transaction txn = new Transaction();
            txn.setTransactionId("TXN_" + System.currentTimeMillis());
            txn.setAmount(BigDecimal.valueOf(dto.getAmount()));
            txn.setType(dto.getCategory());
            txn.setTimestamp(LocalDateTime.now());

            // Set fraud assessment
            double fraudProb = fraudResponse != null ? (Double) fraudResponse.get("fraud_probability") : 0.5;
            txn.setFraudScore((int) (fraudProb * 100));
            
            if (fraudProb >= 0.8) {
                txn.setRiskLevel(RiskLevel.CRITICAL);
                txn.setStatus("BLOCKED");
            } else if (fraudProb >= 0.6) {
                txn.setRiskLevel(RiskLevel.HIGH);
                txn.setStatus("FLAGGED");
            } else if (fraudProb >= 0.3) {
                txn.setRiskLevel(RiskLevel.MEDIUM);
                txn.setStatus("REVIEW");
            } else {
                txn.setRiskLevel(RiskLevel.LOW);
                txn.setStatus("APPROVED");
            }

            return new ResponseEntity<>(transactionRepository.save(txn), HttpStatus.CREATED);
        } catch (Exception e) {
            throw new InvalidRequestException("Fraud detection failed");
        }
    }
}
