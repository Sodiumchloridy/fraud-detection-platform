package com.workshop.backend.repository;

import com.workshop.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for User CRUD operations
 * Derived query methods
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Derived query - finds user by username
     * Used by: Login endpoint
     */
    Optional<User> findByUsername(String username);
}
