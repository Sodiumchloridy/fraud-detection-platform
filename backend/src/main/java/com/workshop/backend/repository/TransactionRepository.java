package com.workshop.backend.repository;

import com.workshop.backend.model.Transaction;
import com.workshop.backend.model.Transaction.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * FEATURE 4: Repository for Transaction CRUD operations
 * FEATURE 5: Custom queries (derived, JPQL, native SQL)
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * FEATURE 5: Derived query - finds transactions with specific risk level
     */
    List<Transaction> findByRiskLevel(RiskLevel riskLevel);

    /**
     * FEATURE 5: Derived query - finds HIGH or CRITICAL risk transactions
     * Used by: /api/transactions/high-risk endpoint
     */
    List<Transaction> findByRiskLevelIn(List<RiskLevel> riskLevels);

    /**
     * FEATURE 5: JPQL aggregate query - counts transactions by risk level
     * Used by: /api/transactions/stats endpoint
     */
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.riskLevel = :riskLevel")
    Long countByRiskLevel(@Param("riskLevel") RiskLevel riskLevel);
}
