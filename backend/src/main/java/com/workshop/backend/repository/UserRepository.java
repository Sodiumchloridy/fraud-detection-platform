package com.workshop.backend.repository;

import com.workshop.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * FEATURE 4: Basic CRUD operations using Spring Data JPA Repository
 * Provides standard CRUD methods for User entity
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * FEATURE 5: Derived query method
     * Finds a user by username (case-sensitive)
     */
    Optional<User> findByUsername(String username);

    /**
     * FEATURE 5: Derived query method
     * Finds users by role
     */
    List<User> findByRole(String role);

    /**
     * FEATURE 5: Derived query method
     * Finds enabled users by role
     */
    List<User> findByRoleAndEnabled(String role, boolean enabled);

    /**
     * FEATURE 5: Derived query method
     * Checks if a username already exists
     */
    boolean existsByUsername(String username);

    /**
     * FEATURE 5: JPQL query example
     * Finds users by email domain using LIKE operator
     */
    @Query("SELECT u FROM User u WHERE u.email LIKE %:domain%")
    List<User> findByEmailDomain(@Param("domain") String domain);

    /**
     * FEATURE 5: Native SQL query
     * Finds all active admin users using native SQL
     */
    @Query(value = "SELECT * FROM users WHERE role = 'ADMIN' AND enabled = true", nativeQuery = true)
    List<User> findActiveAdmins();
}
