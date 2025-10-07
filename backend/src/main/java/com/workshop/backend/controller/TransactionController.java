package com.workshop.backend.controller;

import com.workshop.backend.exception.InvalidRequestException;
import com.workshop.backend.exception.ResourceNotFoundException;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.model.Transaction.RiskLevel;
import com.workshop.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
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
 * @RestController combines @Controller and @ResponseBody - returns data directly as JSON
 * @RequestMapping defines base URL path for all endpoints in this controller
 * @CrossOrigin allows frontend (Angular) to make requests from different origin
 */
@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:4200")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    /**
     * FEATURE 1: GET endpoint to retrieve all transactions
     * FEATURE 2: @GetMapping maps HTTP GET requests
     * URL: GET /api/transactions
     */
    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = transactionRepository.findAll();
        return ResponseEntity.ok(transactions);
    }

    /**
     * FEATURE 1: GET endpoint with path variable
     * FEATURE 2: @PathVariable extracts {id} from URL path
     * URL: GET /api/transactions/5
     */
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
        return ResponseEntity.ok(transaction);
    }

    /**
     * FEATURE 1: GET endpoint with query parameters for filtering
     * FEATURE 2: @RequestParam extracts query parameters from URL
     * URL: GET /api/transactions/filter?riskLevel=HIGH&status=FLAGGED
     */
    @GetMapping("/filter")
    public ResponseEntity<List<Transaction>> getTransactionsByRiskAndStatus(
            @RequestParam(required = false) RiskLevel riskLevel,
            @RequestParam(required = false) String status) {
        
        if (riskLevel != null && status != null) {
            // FEATURE 4 & 5: Using derived query method with sorting
            List<Transaction> transactions = transactionRepository
                .findByRiskLevelAndStatusOrderByTimestampDesc(riskLevel, status);
            return ResponseEntity.ok(transactions);
        } else if (riskLevel != null) {
            List<Transaction> transactions = transactionRepository.findByRiskLevel(riskLevel);
            return ResponseEntity.ok(transactions);
        } else {
            return ResponseEntity.ok(transactionRepository.findAll());
        }
    }

    /**
     * FEATURE 1: GET endpoint with pagination and sorting support
     * FEATURE 4: Implements pagination using Spring Data JPA Pageable
     * URL: GET /api/transactions/paginated?page=0&size=10&sortBy=timestamp
     */
    @GetMapping("/paginated")
    public ResponseEntity<Page<Transaction>> getTransactionsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? 
            Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        Page<Transaction> transactions = transactionRepository.findAll(pageable);
        return ResponseEntity.ok(transactions);
    }

    /**
     * FEATURE 1: GET endpoint for high-risk alerts
     * FEATURE 5: Uses custom JPQL query to find flagged transactions in date range
     * URL: GET /api/transactions/alerts?startDate=2025-01-01T00:00:00&endDate=2025-12-31T23:59:59
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<Transaction>> getHighRiskAlerts(
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) 
            LocalDateTime startDate,
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) 
            LocalDateTime endDate) {
        
        // Default to last 30 days if no dates provided
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        // FEATURE 5: Using JPQL query
        List<Transaction> alerts = transactionRepository
            .findFlaggedTransactionsInDateRange(startDate, endDate);
        return ResponseEntity.ok(alerts);
    }

    /**
     * FEATURE 1: GET endpoint for suspicious high-value transactions
     * FEATURE 5: Uses native SQL query
     * URL: GET /api/transactions/suspicious?threshold=1000
     */
    @GetMapping("/suspicious")
    public ResponseEntity<List<Transaction>> getSuspiciousTransactions(
            @RequestParam(defaultValue = "1000") BigDecimal threshold) {
        
        // FEATURE 5: Using native SQL query
        List<Transaction> suspicious = transactionRepository
            .findHighValueSuspiciousTransactions(threshold);
        return ResponseEntity.ok(suspicious);
    }

    /**
     * FEATURE 1: GET endpoint for transactions by type and amount
     * FEATURE 5: Uses JPQL query with multiple parameters
     * URL: GET /api/transactions/by-type?type=WIRE_TRANSFER&minAmount=500
     */
    @GetMapping("/by-type")
    public ResponseEntity<List<Transaction>> getTransactionsByType(
            @RequestParam String type,
            @RequestParam(defaultValue = "0") BigDecimal minAmount) {
        
        // FEATURE 5: Using JPQL query
        List<Transaction> transactions = transactionRepository
            .findTransactionsByTypeAndMinAmount(type, minAmount);
        return ResponseEntity.ok(transactions);
    }

    /**
     * FEATURE 1: GET endpoint for dashboard statistics
     * FEATURE 5: Uses aggregate queries to count transactions by risk level
     * URL: GET /api/transactions/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // FEATURE 5: Using JPQL aggregate query
        stats.put("totalTransactions", transactionRepository.count());
        stats.put("lowRisk", transactionRepository.countByRiskLevel(RiskLevel.LOW));
        stats.put("mediumRisk", transactionRepository.countByRiskLevel(RiskLevel.MEDIUM));
        stats.put("highRisk", transactionRepository.countByRiskLevel(RiskLevel.HIGH));
        stats.put("criticalRisk", transactionRepository.countByRiskLevel(RiskLevel.CRITICAL));
        
        return ResponseEntity.ok(stats);
    }

    /**
     * FEATURE 1: POST endpoint to create a new transaction
     * FEATURE 2: @PostMapping maps HTTP POST requests
     * FEATURE 4: Uses repository.save() for CREATE operation
     * URL: POST /api/transactions
     * Body: JSON with transaction data
     */
    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestBody Transaction transaction) {
        // FEATURE 6: Validate input
        if (transaction.getAmount() == null || transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("Transaction amount must be greater than zero");
        }
        if (transaction.getType() == null || transaction.getType().trim().isEmpty()) {
            throw new InvalidRequestException("Transaction type is required");
        }
        
        transaction.setTimestamp(LocalDateTime.now());
        
        // FEATURE 4: CRUD - Create operation
        Transaction savedTransaction = transactionRepository.save(transaction);
        return new ResponseEntity<>(savedTransaction, HttpStatus.CREATED);
    }

    /**
     * FEATURE 1: PUT endpoint to update an existing transaction
     * FEATURE 2: @PutMapping maps HTTP PUT requests, uses both @PathVariable and @RequestBody
     * FEATURE 4: Uses repository.save() for UPDATE operation
     * URL: PUT /api/transactions/5
     */
    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(
            @PathVariable Long id, 
            @RequestBody Transaction transactionDetails) {
        
        // FEATURE 4: CRUD - Read operation to check if exists
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
        
        // Update fields
        if (transactionDetails.getAmount() != null) {
            transaction.setAmount(transactionDetails.getAmount());
        }
        if (transactionDetails.getType() != null) {
            transaction.setType(transactionDetails.getType());
        }
        if (transactionDetails.getDescription() != null) {
            transaction.setDescription(transactionDetails.getDescription());
        }
        if (transactionDetails.getRiskLevel() != null) {
            transaction.setRiskLevel(transactionDetails.getRiskLevel());
        }
        if (transactionDetails.getStatus() != null) {
            transaction.setStatus(transactionDetails.getStatus());
        }
        
        // FEATURE 4: CRUD - Update operation
        Transaction updatedTransaction = transactionRepository.save(transaction);
        return ResponseEntity.ok(updatedTransaction);
    }

    /**
     * FEATURE 1: DELETE endpoint to remove a transaction
     * FEATURE 2: @DeleteMapping maps HTTP DELETE requests
     * FEATURE 4: Uses repository.deleteById() for DELETE operation
     * URL: DELETE /api/transactions/5
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTransaction(@PathVariable Long id) {
        // FEATURE 4: CRUD - Read to verify existence before delete
        if (!transactionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Transaction", id);
        }
        
        // FEATURE 4: CRUD - Delete operation
        transactionRepository.deleteById(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Transaction deleted successfully");
        response.put("id", id.toString());
        
        return ResponseEntity.ok(response);
    }

    /**
     * FEATURE 1: PATCH endpoint to update transaction status only
     * URL: PATCH /api/transactions/5/status?status=APPROVED
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Transaction> updateTransactionStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
        
        transaction.setStatus(status);
        Transaction updatedTransaction = transactionRepository.save(transaction);
        
        return ResponseEntity.ok(updatedTransaction);
    }
}
