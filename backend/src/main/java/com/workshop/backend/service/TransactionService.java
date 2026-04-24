package com.workshop.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workshop.backend.config.ThresholdConfig;
import com.workshop.backend.dto.FraudPredictionResponse;
import com.workshop.backend.dto.TransactionEvent;
import com.workshop.backend.dto.TransactionRequest;
import com.workshop.backend.enums.TransactionStatus;
import com.workshop.backend.mapper.TransactionMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final ObjectMapper objectMapper;
    private final ThresholdConfig thresholdConfig;
    private final RestTemplate restTemplate;
    private final SseEmitterService sseEmitterService;
    private final TransactionProducer transactionProducer;

    @Value("${fraud-service.base-url}")
    private String fraudServiceBaseUrl;

    @Value("${fraud-service.api-key}")
    private String fraudServiceApiKey;

    public List<Transaction> findAll() {
        return transactionRepository.findAll();
    }

    public List<Transaction> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return transactionRepository.findAll(PageRequest.of(0, limit)).getContent();
        }
        return transactionRepository.searchByQuery(query.trim(), PageRequest.of(0, limit));
    }

    public Transaction findById(UUID id) {
        return transactionRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Transaction not found with id: " + id));
    }

    public List<Transaction> findFlagged() {
        return transactionRepository.findByStatus(TransactionStatus.FLAGGED);
    }

    public Map<String, Object> getStats() {
        long total    = transactionRepository.count();
        long flagged  = transactionRepository.countByRiskScoreGreaterThanEqual(thresholdConfig.getFlaggedThreshold());
        long blocked  = transactionRepository.countByRiskScoreGreaterThanEqual(thresholdConfig.getBlockedThreshold());
        long approved = total - flagged;
        long flaggedOnly = flagged - blocked;

        double fraudRate    = total > 0 ? (double) blocked / total * 100 : 0;
        double approvalRate = total > 0 ? (double) approved / total * 100 : 0;

        double totalVolume     = transactionRepository.sumAmount();
        double avgAmount       = transactionRepository.avgAmount();
        double amountAtRisk    = transactionRepository.sumAmountByRiskScoreGreaterThanEqual(thresholdConfig.getFlaggedThreshold());
        double blockedAmount   = transactionRepository.sumAmountByRiskScoreGreaterThanEqual(thresholdConfig.getBlockedThreshold());
        long   pendingReview   = transactionRepository.countPendingReview();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total",          total);
        stats.put("approved",       approved);
        stats.put("flagged",        flaggedOnly);
        stats.put("blocked",        blocked);
        stats.put("fraudRate",      Math.round(fraudRate * 100.0) / 100.0);
        stats.put("approvalRate",   Math.round(approvalRate * 100.0) / 100.0);
        stats.put("totalVolume",    Math.round(totalVolume * 100.0) / 100.0);
        stats.put("avgAmount",      Math.round(avgAmount * 100.0) / 100.0);
        stats.put("amountAtRisk",   Math.round(amountAtRisk * 100.0) / 100.0);
        stats.put("blockedAmount",  Math.round(blockedAmount * 100.0) / 100.0);
        stats.put("pendingReview",  pendingReview);

        return stats;
    }

    public Transaction updateStatus(UUID id, String status, String reviewerUsername, Integer isFraud) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Transaction not found with id: " + id));

        TransactionStatus txnStatus = TransactionStatus.valueOf(status.toUpperCase());
        transaction.setStatus(txnStatus);
        if (isFraud != null) {
            transaction.setIsFraud(isFraud);
        }
        transaction.setReviewedBy(reviewerUsername);
        transaction.setReviewedAt(LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

    public Transaction submitWithFraudCheck(TransactionRequest dto) {
        try {
            Transaction txn = transactionMapper.toTransaction(dto);
            txn.setTimestamp(dto.getTimestamp() != null
                    ? LocalDateTime.ofInstant(Instant.parse(dto.getTimestamp()), ZoneId.systemDefault())
                    : LocalDateTime.now());
            txn.setMerchant(dto.getMerchant() != null ? dto.getMerchant() : "");
            txn.setChannel(dto.getChannel() != null ? dto.getChannel() : "in_store");

            // Build location history (required for travel_velocity_kmh rule)
            List<Transaction> recentHistory = transactionRepository.findTop20ByCardNumberOrderByTimestampDesc(dto.getCardNumber());
            List<Map<String, Object>> history = new ArrayList<>();
            for (int i = recentHistory.size() - 1; i >= 0; i--) {
                Transaction h = recentHistory.get(i);
                Map<String, Object> entry = new HashMap<>();
                entry.put("amount", h.getAmount());
                entry.put("timestamp", h.getTimestamp().atZone(ZoneId.systemDefault()).toInstant().toString());
                entry.put("latitude",  h.getLatitude()  != null ? h.getLatitude()  : 0.0);
                entry.put("longitude", h.getLongitude() != null ? h.getLongitude() : 0.0);
                entry.put("merchant",  h.getMerchant()  != null ? h.getMerchant()  : "");
                entry.put("device_info", h.getDeviceInfo() != null ? h.getDeviceInfo() : "");
                entry.put("purchaser_email_domain", h.getPurchaserEmailDomain() != null ? h.getPurchaserEmailDomain() : "");
                history.add(entry);
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("transaction", dto);
            payload.put("history", history);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-API-Key", fraudServiceApiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            FraudPredictionResponse resp = restTemplate.postForObject(
                    fraudServiceBaseUrl + "/predict", entity, FraudPredictionResponse.class);

            double prob = resp.getFraudProbability();
            transactionMapper.applyFeatures(resp.getFeatures(), txn);

            txn.setRiskScore(prob);
            txn.setStatus(prob >= thresholdConfig.getBlockedThreshold() ? TransactionStatus.BLOCKED
                    : prob >= thresholdConfig.getFlaggedThreshold() ? TransactionStatus.FLAGGED
                    : TransactionStatus.APPROVED);

            Transaction saved = transactionRepository.save(txn);

            sseEmitterService.broadcastTransaction(saved);

            // Fire-and-forget: async Kafka publish for SHAP computation
            TransactionEvent event = transactionMapper.toEvent(saved);
            transactionProducer.send(event);

            return saved;
        } catch (Exception e) {
            throw new RuntimeException("Transaction submission failed: " + e.getMessage(), e);
        }
    }
}
