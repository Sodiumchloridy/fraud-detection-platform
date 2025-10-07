package com.workshop.backend.exception;

/**
 * FEATURE 6: Custom exception for resource not found scenarios
 * Thrown when a requested entity (Transaction, User, etc.) doesn't exist
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, Long id) {
        super(String.format("%s not found with id: %d", resourceName, id));
    }
}
