package com.workshop.backend.service;

import com.workshop.backend.model.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Manages SSE (Server-Sent Events) connections and broadcasts
 * transaction events to all connected clients in real-time.
 */
@Service
public class SseEmitterService {

    private static final Logger log = LoggerFactory.getLogger(SseEmitterService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Register a new SSE client connection.
     */
    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.debug("SSE client disconnected (completion). Active: {}", emitters.size());
        });
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(emitter);
            log.debug("SSE client disconnected (timeout). Active: {}", emitters.size());
        });
        emitter.onError(e -> {
            emitters.remove(emitter);
            log.debug("SSE client disconnected (error). Active: {}", emitters.size());
        });

        emitters.add(emitter);
        log.debug("New SSE client connected. Active: {}", emitters.size());
        return emitter;
    }

    /**
     * Broadcast a new transaction event to all connected SSE clients.
     */
    public void broadcastTransaction(Transaction transaction) {
        List<SseEmitter> deadEmitters = new java.util.ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("transaction")
                        .data(transaction));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);

        if (!deadEmitters.isEmpty()) {
            log.debug("Removed {} dead SSE emitters. Active: {}", deadEmitters.size(), emitters.size());
        }
    }

    /**
     * Broadcast updated stats to all connected SSE clients.
     */
    public void broadcastStats(Object stats) {
        List<SseEmitter> deadEmitters = new java.util.ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("stats")
                        .data(stats));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);
    }

    public int getActiveConnectionCount() {
        return emitters.size();
    }
}
