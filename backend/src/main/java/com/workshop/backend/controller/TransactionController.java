package com.workshop.backend.controller;

import com.workshop.backend.exception.InvalidRequestException;
import com.workshop.backend.exception.ResourceNotFoundException;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.model.Transaction.RiskLevel;
import com.workshop.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FEATURE 1 & 2: REST API Controller for Transaction Management
 * Provides endpoints that align with Angular frontend needs
 */
@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:4200")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    /**
     * FEATURE 1: GET all transactions for dashboard feed
     * Used by: DashboardComponent
     */
    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = transactionRepository.findAll();
        return ResponseEntity.ok(transactions);
    }

    /**
     * FEATURE 1: GET transaction by ID for detail view
     * FEATURE 2: @PathVariable for route parameter
     * Used by: TransactionDetailsComponent
     */
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
        return ResponseEntity.ok(transaction);
    }

    /**
     * FEATURE 1: GET high-risk transactions for alerts page
     * FEATURE 5: Uses derived query method
     * Used by: HighRiskAlertsComponent
     */
    @GetMapping("/high-risk")
    public ResponseEntity<List<Transaction>> getHighRiskTransactions() {
        // FEATURE 5: Derived query - finds HIGH and CRITICAL risk transactions
        List<Transaction> highRisk = transactionRepository.findByRiskLevelIn(
            List.of(RiskLevel.HIGH, RiskLevel.CRITICAL)
        );
        return ResponseEntity.ok(highRisk);
    }

    /**
     * FEATURE 1: GET dashboard statistics
     * FEATURE 5: Uses JPQL aggregate queries
     * Used by: DashboardComponent stats cards
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // FEATURE 5: JPQL aggregate queries
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
     * FEATURE 1: POST to create new transaction
     * FEATURE 4: CRUD - Create operation
     * Used by: Dashboard for adding new transactions
     */
    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestBody Transaction transaction) {
        // FEATURE 6: Input validation
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
        
        // FEATURE 4: CRUD - Create
        Transaction savedTransaction = transactionRepository.save(transaction);
        return new ResponseEntity<>(savedTransaction, HttpStatus.CREATED);
    }

    /**
     * FEATURE 1: PATCH to update transaction status
     * Used by: TransactionDetailsComponent (mark as legitimate/fraud)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Transaction> updateTransactionStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        
        // FEATURE 4: CRUD - Read and Update
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
        
        transaction.setStatus(status);
        Transaction updated = transactionRepository.save(transaction);
        
        return ResponseEntity.ok(updated);
    }

    /**
     * FEATURE 1: DELETE transaction
     * FEATURE 4: CRUD - Delete operation
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTransaction(@PathVariable Long id) {
        // FEATURE 6: Check existence before delete
        if (!transactionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Transaction", id);
        }
        
        // FEATURE 4: CRUD - Delete
        transactionRepository.deleteById(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Transaction deleted successfully");
        response.put("id", id.toString());
        
        return ResponseEntity.ok(response);
    }
}
