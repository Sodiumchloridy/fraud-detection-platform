package com.workshop.backend.exception;

/**
 * FEATURE 6: Custom exception for invalid request data
 * Thrown when client sends malformed or invalid data
 */
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
