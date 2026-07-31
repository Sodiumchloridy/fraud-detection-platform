package com.workshop.backend.service;

import com.workshop.backend.dto.TransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionProducer {

    private final ObjectProvider<KafkaTemplate<String, TransactionEvent>> kafkaTemplateProvider;
    private static final String TOPIC = "transactions.pending-shap";

    @Async
    public void send(TransactionEvent event) {
        try {
            KafkaTemplate<String, TransactionEvent> kafkaTemplate = kafkaTemplateProvider.getIfAvailable();
            if (kafkaTemplate != null) {
                kafkaTemplate.send(TOPIC, event.getId().toString(), event);
            } else {
                log.debug("KafkaTemplate not available, skipping SHAP event dispatch for transaction {}", event.getId());
            }
        } catch (Exception e) {
            log.warn("Kafka send failed for transaction {}: {}", event.getId(), e.getMessage());
        }
    }
}