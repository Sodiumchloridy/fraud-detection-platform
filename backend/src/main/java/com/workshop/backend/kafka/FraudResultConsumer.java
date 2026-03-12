package com.workshop.backend.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workshop.backend.config.ThresholdConfig;
import com.workshop.backend.dto.FraudPredictionResponse;
import com.workshop.backend.enums.TransactionStatus;
import com.workshop.backend.mapper.TransactionMapper;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.repository.TransactionRepository;
import com.workshop.backend.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class FraudResultConsumer {

    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final ObjectMapper objectMapper;
    private final ThresholdConfig thresholdConfig;
    private final SseEmitterService sseEmitterService;

    @KafkaListener(topics = KafkaTopicConfig.TOPIC_SCORED, groupId = "fraud-backend")
    public void onFraudResult(Map<String, Object> message) {
        String txnId = (String) message.get("transactionId");
        try {
            Transaction txn = transactionRepository.findById(UUID.fromString(txnId))
                    .orElseThrow(() -> new IllegalStateException("Transaction not found: " + txnId));

            FraudPredictionResponse resp = objectMapper.convertValue(message.get("result"), FraudPredictionResponse.class);
            double prob = resp.getFraudProbability();

            transactionMapper.applyFeatures(resp.getFeatures(), txn);
            if (resp.getShap() != null) txn.setShapJson(objectMapper.writeValueAsString(resp.getShap()));

            txn.setRiskScore(prob);
            txn.setStatus(prob >= thresholdConfig.getBlockedThreshold() ? TransactionStatus.BLOCKED
                    : prob >= thresholdConfig.getFlaggedThreshold() ? TransactionStatus.FLAGGED
                    : TransactionStatus.APPROVED);

            sseEmitterService.broadcastTransaction(transactionRepository.save(txn));
            log.info("Scored txn {}: {} → {}", txnId, prob, txn.getStatus());
        } catch (Exception e) {
            log.error("Failed to process fraud result for {}", txnId, e);
        }
    }
}
