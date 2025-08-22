package com.trustseal.api.repository;

import com.trustseal.api.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Credential entity operations
 */
@Repository
public interface CredentialRepository extends JpaRepository<Credential, Long> {
    
    /**
     * Find credential by external credential ID
     */
    Optional<Credential> findByCredentialId(String credentialId);
    
    /**
     * Find credentials by student
     */
    List<Credential> findByStudentId(Long studentId);
    
    /**
     * Find credentials by student student ID
     */
    List<Credential> findByStudentStudentId(String studentId);
    
    /**
     * Find credentials by issuer
     */
    List<Credential> findByIssuerId(Long issuerId);
    
    /**
     * Find credentials by institution
     */
    List<Credential> findByInstitution(String institution);
    
    /**
     * Find credentials by status
     */
    List<Credential> findByStatus(String status);
    
    /**
     * Find credentials by degree
     */
    List<Credential> findByDegree(String degree);
}
