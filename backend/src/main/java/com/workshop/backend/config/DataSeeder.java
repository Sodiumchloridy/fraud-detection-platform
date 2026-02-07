package com.workshop.backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workshop.backend.dto.TransactionDto;
import com.workshop.backend.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.util.*;

/**
 * Seeds sample transactions after the server is fully ready by POSTing
 * each one to /api/transactions/fraud-check, which calls the fraud-engine
 * and persists the result. Transactions arrive with a random delay so
 * the fraud-engine's velocity / frequency features behave realistically.
 */
@Component
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${server.port:8080}")
    private int serverPort;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void seed() {
        if (transactionRepository.count() > 0) {
            log.info("Transactions already exist — skipping seed.");
            return;
        }

        List<TransactionDto> seeds;
        try {
            InputStream inputStream = new ClassPathResource("transactions.json").getInputStream();
            seeds = objectMapper.readValue(inputStream, new TypeReference<List<TransactionDto>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to load transactions.json", e);
        }

        log.info("Seeding {} transactions via /api/transactions/fraud-check ...", seeds.size());
        String endpoint = "http://localhost:" + serverPort + "/api/transactions/fraud-check";
        Random rng = new Random(42);

        for (int i = 0; i < seeds.size(); i++) {
            TransactionDto dto = seeds.get(i);
            long delay = 500 + rng.nextInt(2500);
            try { Thread.sleep(delay); } catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
            restTemplate.postForObject(endpoint, dto, Map.class);
            log.info("[{}/{}] Sent {} ${}", i + 1, seeds.size(), dto.getCategory(), dto.getAmount());
        }
        log.info("Seeding complete — {} transactions in database.", transactionRepository.count());
    }
}
