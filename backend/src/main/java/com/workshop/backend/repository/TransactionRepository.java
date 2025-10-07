package com.workshop.backend.repository;

import com.workshop.backend.model.Transaction;
import com.workshop.backend.model.Transaction.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * FEATURE 4: Basic CRUD operations using Spring Data JPA Repository
 * JpaRepository provides built-in methods: save(), findById(), findAll(), deleteById(), etc.
 * Also includes sorting and pagination via Pageable interface
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * FEATURE 5: Derived query method - Spring Data JPA automatically implements this
     * Finds all transactions with a specific risk level
     */
    List<Transaction> findByRiskLevel(RiskLevel riskLevel);

    /**
     * FEATURE 5: Derived query method with sorting
     * Finds transactions by risk level and status, ordered by timestamp descending
     */
    List<Transaction> findByRiskLevelAndStatusOrderByTimestampDesc(RiskLevel riskLevel, String status);

    /**
     * FEATURE 4: Pagination and sorting support
     * Returns a page of transactions for a specific risk level
     */
    Page<Transaction> findByRiskLevel(RiskLevel riskLevel, Pageable pageable);

    /**
     * FEATURE 5: Derived query - finds transactions greater than specified amount
     */
    List<Transaction> findByAmountGreaterThan(BigDecimal amount);

    /**
     * FEATURE 5: Derived query - finds transactions between date range
     */
    List<Transaction> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    /**
     * FEATURE 5: Native SQL query example
     * Uses native SQL to find transactions above a threshold amount
     * nativeQuery = true indicates this is raw SQL, not JPQL
     */
    @Query(value = "SELECT * FROM transactions WHERE amount > :threshold AND risk_level IN ('HIGH', 'CRITICAL') ORDER BY amount DESC", 
           nativeQuery = true)
    List<Transaction> findHighValueSuspiciousTransactions(@Param("threshold") BigDecimal threshold);

    /**
     * FEATURE 5: JPQL (Jakarta Persistence Query Language) query example
     * JPQL uses entity names and properties instead of table/column names
     * Finds transactions by type and minimum amount
     */
    @Query("SELECT t FROM Transaction t WHERE t.type = :type AND t.amount >= :minAmount ORDER BY t.timestamp DESC")
    List<Transaction> findTransactionsByTypeAndMinAmount(
        @Param("type") String type, 
        @Param("minAmount") BigDecimal minAmount
    );

    /**
     * FEATURE 5: JPQL aggregate query
     * Counts transactions by risk level
     */
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.riskLevel = :riskLevel")
    Long countByRiskLevel(@Param("riskLevel") RiskLevel riskLevel);

    /**
     * FEATURE 5: JPQL query with multiple conditions
     * Complex query to find flagged or blocked transactions in a date range
     */
    @Query("SELECT t FROM Transaction t WHERE t.status IN ('FLAGGED', 'BLOCKED') " +
           "AND t.timestamp BETWEEN :startDate AND :endDate " +
           "ORDER BY t.amount DESC")
    List<Transaction> findFlaggedTransactionsInDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
