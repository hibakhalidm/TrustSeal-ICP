package com.trustseal.api.repository;

import com.trustseal.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity operations
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Find user by username
     */
    Optional<User> findByUsername(String username);
    
    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Find user by student ID
     */
    Optional<User> findByStudentId(String studentId);
    
    /**
     * Find users by role
     */
    List<User> findByRole(User.UserRole role);
    
    /**
     * Find users by institution
     */
    List<User> findByInstitution(String institution);
}
