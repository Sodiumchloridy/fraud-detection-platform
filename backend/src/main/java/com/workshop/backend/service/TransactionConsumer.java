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
        log.info("Received SHAP result for transaction: {}", event.getTransactionId());

        Transaction txn = transactionRepository.findById(event.getTransactionId())
            .orElseThrow(() -> {
                log.error("Transaction not found: {}", event.getTransactionId());
                return new IllegalStateException("Transaction not found: " + event.getTransactionId());
            });

        try {
            if (event.getShap() != null) {
                txn.setShapJson(objectMapper.writeValueAsString(event.getShap()));
            }
        } catch (Exception e) {
            log.warn("Failed to serialize SHAP data for transaction {}: {}", event.getTransactionId(), e.getMessage());
        }

        Transaction saved = transactionRepository.save(txn);
        sseEmitterService.broadcastTransaction(saved);

        log.info("SHAP data updated for transaction {}", saved.getId());
    }
}
