package com.workshop.backend.config;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.workshop.backend.dto.TransactionRequest;
import com.workshop.backend.repository.TransactionRepository;
import com.workshop.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.*;

/**
 * Seeds sample transactions after the server is fully ready by POSTing
 * them to /api/transactions/fraud-check in batches of 3–10 per second.
 * Each batch is dispatched concurrently; the seeder sleeps 1 s between
 * batches so the fraud-service's velocity / frequency features behave
 * realistically. Failures are logged and skipped — the seeder continues.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final int BATCH_MIN = 3;
    private static final int BATCH_MAX = 10;
    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;

    @Value("${server.port:8080}")
    private int serverPort;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void seed() {
        if (transactionRepository.count() > 0) {
            log.info("Transactions already exist — skipping seed.");
            return;
        }

        List<TransactionRequest> seeds;
        try {
            InputStream inputStream = new ClassPathResource("transactions.json").getInputStream();
            seeds = objectMapper.readValue(inputStream, new TypeReference<List<TransactionRequest>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to load transactions.json", e);
        }

        log.info("Seeding {} transactions via /api/transactions/fraud-check ({}–{} TPS) ...",
                seeds.size(), BATCH_MIN, BATCH_MAX);
        String endpoint = "http://localhost:" + serverPort + "/api/transactions/fraud-check";
        Random rng = new Random(42);

        // Generate a JWT token for the system seeder (uses ADMIN role)
        String token = jwtUtil.generateToken("admin", "ADMIN");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        ExecutorService pool = Executors.newFixedThreadPool(BATCH_MAX);
        int i = 0;
        try {
            while (i < seeds.size()) {
                int batchSize = Math.min(
                        BATCH_MIN + rng.nextInt(BATCH_MAX - BATCH_MIN + 1),
                        seeds.size() - i);

                List<CompletableFuture<Void>> futures = new ArrayList<>(batchSize);
                for (int j = 0; j < batchSize; j++) {
                    final int idx = i + j;
                    final TransactionRequest dto = seeds.get(idx);
                    futures.add(CompletableFuture.runAsync(() -> {
                        HttpEntity<TransactionRequest> entity = new HttpEntity<>(dto, headers);
                        try {
                            restTemplate.postForObject(endpoint, entity, Map.class);
                            log.info("[{}/{}] Sent {} ${}", idx + 1, seeds.size(), dto.getCategory(), dto.getAmount());
                        } catch (Exception e) {
                            log.warn("[{}/{}] Failed {} ${}: {}", idx + 1, seeds.size(), dto.getCategory(), dto.getAmount(), e.getMessage());
                        }
                    }, pool));
                }

                // Wait for all in-flight requests before sleeping
                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                i += batchSize;

                if (i < seeds.size()) {
                    Thread.sleep(1_000);
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            pool.shutdown();
        }
        log.info("Seeding complete — {} transactions in database.", transactionRepository.count());
    }
}
