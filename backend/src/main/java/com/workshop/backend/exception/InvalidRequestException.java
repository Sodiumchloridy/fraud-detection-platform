package com.workshop.backend.exception;

/**
 * Custom exception for invalid request data
 * Thrown when client sends malformed or invalid data
 */
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
