package com.workshop.backend.repository;

import com.workshop.backend.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Transaction CRUD operations
 * Custom queries (derived, JPQL, native SQL)
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByRiskScoreGreaterThanEqual(Double threshold);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.riskScore >= :threshold")
    Long countByRiskScoreGreaterThanEqual(@Param("threshold") Double threshold);
}
