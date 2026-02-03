package com.workshop.backend.repository;

import com.workshop.backend.model.Transaction;
import com.workshop.backend.model.Transaction.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Transaction CRUD operations
 * Custom queries (derived, JPQL, native SQL)
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Derived query - finds transactions with specific risk level
     */
    List<Transaction> findByRiskLevel(RiskLevel riskLevel);

    /**
     * Derived query - finds HIGH or CRITICAL risk transactions
     * Used by: /api/transactions/high-risk endpoint
     */
    List<Transaction> findByRiskLevelIn(List<RiskLevel> riskLevels);

    /**
     * JPQL aggregate query - counts transactions by risk level
     * Used by: /api/transactions/stats endpoint
     */
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.riskLevel = :riskLevel")
    Long countByRiskLevel(@Param("riskLevel") RiskLevel riskLevel);
}
