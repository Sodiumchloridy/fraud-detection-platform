package com.workshop.backend.service;

import com.workshop.backend.model.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Manages SSE (Server-Sent Events) connections and broadcasts
 * transaction events to all connected clients in real-time.
 */
@Service
public class SseEmitterService {

    private static final Logger log = LoggerFactory.getLogger(SseEmitterService.class);
    private static final long SSE_TIMEOUT = 60 * 1000L;
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.debug("SSE client disconnected (completion). Active: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitter.complete();
            log.debug("SSE client disconnected (timeout). Active: {}", emitters.size());
        });
        
        emitter.onError(e -> {
            emitter.complete();
            log.debug("SSE client disconnected (error). Active: {}", emitters.size());
        });

        emitters.add(emitter);
        log.debug("New SSE client connected. Active: {}", emitters.size());
        return emitter;
    }

    public void broadcastTransaction(Transaction transaction) {
        broadcast("transaction", transaction);
    }

    public void broadcastStats(Object stats) {
        broadcast("stats", stats);
    }

    private void broadcast(String eventName, Object data) {
        SseEmitter.SseEventBuilder event = SseEmitter.event()
            .name(eventName)
            .data(data);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(event);
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        }
    }
}
