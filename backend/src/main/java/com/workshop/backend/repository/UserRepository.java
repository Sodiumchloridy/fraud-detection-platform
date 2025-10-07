package com.workshop.backend.repository;

import com.workshop.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * FEATURE 4: Repository for User CRUD operations
 * FEATURE 5: Derived query methods
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * FEATURE 5: Derived query - finds user by username
     * Used by: Login endpoint
     */
    Optional<User> findByUsername(String username);
}
