package com.workshop.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workshop.backend.dto.TransactionShapEvent;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionConsumer {

    private final TransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;
    private final SseEmitterService sseEmitterService;

    @KafkaListener(topics = "transactions.shap-completed", groupId = "fraud-detection-backend",
            properties = "spring.json.value.default.type=com.workshop.backend.dto.TransactionShapEvent")
    public void onShapCompleted(TransactionShapEvent event) {
        if (event == null) {
            log.warn("Received undeserializable SHAP message — skipping");
            return;
        }
        log.info("Received SHAP result for transaction: {}", event.getTransactionId());

        Transaction txn = transactionRepository.findById(event.getTransactionId())
            .orElse(null);

        if (txn == null) {
            log.warn("Skipping SHAP result — transaction not found (stale message?): {}", event.getTransactionId());
            return;
        }

        try {
            if (event.getShap() != null) {
                txn.setShapJson(objectMapper.writeValueAsString(event.getShap()));
            }
            Transaction saved = transactionRepository.save(txn);
            sseEmitterService.broadcastTransaction(saved);
            log.info("SHAP data updated for transaction {}", saved.getId());
        } catch (Exception e) {
            log.warn("Failed to persist SHAP data for transaction {}: {}", event.getTransactionId(), e.getMessage());
        }
    }
}
