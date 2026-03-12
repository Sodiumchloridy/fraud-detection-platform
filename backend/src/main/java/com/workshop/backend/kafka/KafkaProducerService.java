package com.workshop.backend.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, Map<String, Object>> kafkaTemplate;

    public void sendFraudCheckRequest(String transactionId, Map<String, Object> payload) {
        log.info("Publishing fraud-check for txn {}", transactionId);
        kafkaTemplate.send(KafkaTopicConfig.TOPIC_PENDING, transactionId, payload);
    }
}
