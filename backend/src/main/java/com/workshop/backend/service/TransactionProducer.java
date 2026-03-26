package com.workshop.backend.service;

import com.workshop.backend.dto.TransactionEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransactionProducer {

    private final KafkaTemplate<String, TransactionEvent> kafkaTemplate;
    private static final String TOPIC = "transactions.pending-shap";

    public void send(TransactionEvent event) {
        kafkaTemplate.send(TOPIC, event.getId().toString(), event);
    }
}