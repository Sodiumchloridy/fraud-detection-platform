package com.workshop.backend.exception;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * Custom error response structure
 * This class defines the structure of error responses sent to clients
 * Provides clear information about what went wrong
 */
@Data
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;

    public ErrorResponse(int status, String error, String message, String path) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }
}
