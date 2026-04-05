package com.workshop.backend.service;

import com.workshop.backend.model.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RedisFeatureStoreService {

    private final StringRedisTemplate redisTemplate;

    // Prefixes for different feature spaces
    private static final String CARD_HISTORY_AMOUNTS = "feature:card:amounts:";
    private static final String EMAIL_HISTORY = "feature:email:txn_times:";

    /**
     * Update the Redis feature store with a new transaction.
     */
    public void pushTransaction(Transaction txn) {
        if (txn == null || txn.getTimestamp() == null) return;

        double amount = txn.getAmount();
        long timestampMillis = txn.getTimestamp().toInstant(ZoneOffset.UTC).toEpochMilli();

        // 1. Store Card History (Score = Timestamp, Value = Timestamp:Amount)
        String cardKey = CARD_HISTORY_AMOUNTS + txn.getCardNumber();
        String amountEntry = timestampMillis + ":" + amount;
        redisTemplate.opsForZSet().add(cardKey, amountEntry, timestampMillis);
        
        // Retain only last 7 days of history for this card (to prevent memory leaks)
        long sevenDaysAgo = timestampMillis - (7L * 24 * 60 * 60 * 1000);
        redisTemplate.opsForZSet().removeRangeByScore(cardKey, 0, sevenDaysAgo);

        // 2. Store Email History (Score = Timestamp, Value = Timestamp)
        if (txn.getPurchaserEmailDomain() != null && !txn.getPurchaserEmailDomain().isEmpty()) {
            String emailKey = EMAIL_HISTORY + txn.getPurchaserEmailDomain();
            redisTemplate.opsForZSet().add(emailKey, String.valueOf(timestampMillis), timestampMillis);
            redisTemplate.opsForZSet().removeRangeByScore(emailKey, 0, sevenDaysAgo);
        }
    }

    /**
     * Retrieve features for the given card/email at the CURRENT timestamp
     */
    public Map<String, Object> calculateFeatures(String cardNumber, String emailDomain, LocalDateTime currentTime) {
        long currentMillis = currentTime != null ? 
                             currentTime.toInstant(ZoneOffset.UTC).toEpochMilli() : 
                             Instant.now().toEpochMilli();

        long oneHourAgo = currentMillis - (60 * 60 * 1000);
        long oneDayAgo = currentMillis - (24 * 60 * 60 * 1000);
        long sevenDaysAgo = currentMillis - (7L * 24 * 60 * 60 * 1000);

        String cardKey = CARD_HISTORY_AMOUNTS + cardNumber;
        
        // Extract 1hr counts
        Long count1h = redisTemplate.opsForZSet().count(cardKey, oneHourAgo, currentMillis);
        Long count24h = redisTemplate.opsForZSet().count(cardKey, oneDayAgo, currentMillis);
        Long count7d = redisTemplate.opsForZSet().count(cardKey, sevenDaysAgo, currentMillis);

        // Extract sum
        Set<String> entries1h = redisTemplate.opsForZSet().rangeByScore(cardKey, oneHourAgo, currentMillis);
        Set<String> entries24h = redisTemplate.opsForZSet().rangeByScore(cardKey, oneDayAgo, currentMillis);
        Set<String> entries7d = redisTemplate.opsForZSet().rangeByScore(cardKey, sevenDaysAgo, currentMillis);

        double sum1h = calculateSum(entries1h);
        double sum24h = calculateSum(entries24h);
        double sum7d = calculateSum(entries7d);

        Map<String, Object> features = new HashMap<>();
        features.put("txn_count_1h", count1h != null ? count1h : 0);
        features.put("txn_count_24h", count24h != null ? count24h : 0);
        features.put("txn_count_7d", count7d != null ? count7d : 0);
        features.put("amt_sum_1h", sum1h);
        features.put("amt_sum_24h", sum24h);
        features.put("amt_sum_7d", sum7d);

        // 3. Email features
        if (emailDomain != null && !emailDomain.isEmpty()) {
            String emailKey = EMAIL_HISTORY + emailDomain;
            Long emailTxns = redisTemplate.opsForZSet().count(emailKey, 0, currentMillis);
            features.put("is_new_email", (emailTxns == null || emailTxns == 0) ? 1.0 : 0.0);
        } else {
            features.put("is_new_email", 0.0);
        }

        return features;
    }

    private double calculateSum(Set<String> entries) {
        if (entries == null || entries.isEmpty()) return 0.0;
        double sum = 0.0;
        for (String entry : entries) {
            String[] parts = entry.split(":");
            if (parts.length == 2) {
                sum += Double.parseDouble(parts[1]);
            }
        }
        return sum;
    }
}
