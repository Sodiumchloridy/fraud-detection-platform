package com.workshop.backend.repository;

import com.workshop.backend.enums.TransactionStatus;
import com.workshop.backend.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import java.time.LocalDateTime;

/**
 * Repository for Transaction CRUD operations
 * Custom queries (derived, JPQL, native SQL)
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByRiskScoreGreaterThanEqual(Double threshold);

    List<Transaction> findByStatus(TransactionStatus status);

    List<Transaction> findByCardNumberOrderByTimestampAsc(String cardNumber);

    List<Transaction> findTop20ByCardNumberOrderByTimestampDesc(String cardNumber);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.cardNumber = :cardNumber AND t.timestamp >= :startDate AND t.timestamp <= :endDate")
    Long countByCardNumberAndTimestampBetween(@Param("cardNumber") String cardNumber, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(t.amount), 0.0) FROM Transaction t WHERE t.cardNumber = :cardNumber AND t.timestamp >= :startDate AND t.timestamp <= :endDate")
    Double sumAmountByCardNumberAndTimestampBetween(@Param("cardNumber") String cardNumber, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.purchaserEmailDomain = :emailDomain AND t.timestamp <= :currentTime")
    Long countByPurchaserEmailDomainAndTimestampBefore(@Param("emailDomain") String emailDomain, @Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.riskScore >= :threshold")
    Long countByRiskScoreGreaterThanEqual(@Param("threshold") Double threshold);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.riskScore >= :threshold")
    Double sumAmountByRiskScoreGreaterThanEqual(@Param("threshold") Double threshold);

    @Query("SELECT COALESCE(AVG(t.amount), 0) FROM Transaction t")
    Double avgAmount();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t")
    Double sumAmount();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = 'FLAGGED' AND t.reviewedBy IS NULL")
    Long countPendingReview();
}
