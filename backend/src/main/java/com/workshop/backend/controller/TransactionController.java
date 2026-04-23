package com.workshop.backend.controller;

import com.workshop.backend.dto.TransactionRequest;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.service.SseEmitterService;
import com.workshop.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final SseEmitterService sseEmitterService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Transaction>> searchTransactions(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "100") int limit) {
        return ResponseEntity.ok(transactionService.search(q, Math.min(limit, 500)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable UUID id) {
        return ResponseEntity.ok(transactionService.findById(id));
    }

    @GetMapping("/flagged")
    public ResponseEntity<List<Transaction>> getFlaggedTransactions() {
        return ResponseEntity.ok(transactionService.findFlagged());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        return ResponseEntity.ok(transactionService.getStats());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Transaction> updateTransactionStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            Authentication authentication) {
        return ResponseEntity.ok(transactionService.updateStatus(id, status, authentication.getName()));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamTransactions() {
        return sseEmitterService.createEmitter();
    }

    @PostMapping("/fraud-check")
    public ResponseEntity<Transaction> createTransactionWithFraudCheck(@RequestBody TransactionRequest dto) {
        try {
            return ResponseEntity.ok(transactionService.submitWithFraudCheck(dto));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
