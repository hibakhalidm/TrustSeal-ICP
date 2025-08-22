package com.trustseal.api.controller;

import com.trustseal.api.entity.Credential;
import com.trustseal.api.service.CredentialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for students (credential holders)
 * 
 * Provides endpoints for students to view their credentials
 * and generate ZK proofs for verification.
 */
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StudentController {
    
    private final CredentialService credentialService;
    
    /**
     * Get all credentials for a student
     */
    @GetMapping("/credentials")
    public ResponseEntity<?> getStudentCredentials(
            @RequestParam String studentId) {
        
        log.info("Fetching credentials for student: {}", studentId);
        
        try {
            var credentials = credentialService.getStudentCredentials(studentId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "credentials", credentials,
                "count", credentials.size(),
                "studentId", studentId
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch student credentials", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to fetch credentials: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get a specific credential by ID
     */
    @GetMapping("/credentials/{id}")
    public ResponseEntity<?> getCredential(@PathVariable Long id) {
        try {
            var credential = credentialService.getCredentialById(id);
            
            if (credential.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "credential", credential.get()
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch credential", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to fetch credential: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Generate a ZK proof for a credential
     * 
     * This endpoint allows students to generate a ZK proof
     * that can be shared with employers for verification.
     */
    @PostMapping("/credentials/{id}/proof")
    public ResponseEntity<?> generateProof(@PathVariable Long id) {
        try {
            var credential = credentialService.getCredentialById(id);
            
            if (credential.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Credential cred = credential.get();
            
            // The proof is already generated when the credential was issued
            // We just need to return the existing proof data
            return ResponseEntity.ok(Map.of(
                "success", true,
                "credentialId", cred.getCredentialId(),
                "proof", cred.getProofData(),
                "qrCode", cred.getQrCodeData(),
                "message", "Proof generated successfully"
            ));
            
        } catch (Exception e) {
            log.error("Failed to generate proof", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to generate proof: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get student profile information
     * 
     * For the hackathon MVP, this returns mock data.
     * In production, this would fetch from the user database.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getStudentProfile(
            @RequestParam String studentId) {
        
        try {
            // Mock student profile for demo
            var profile = Map.of(
                "studentId", studentId,
                "name", "Demo Student",
                "email", "student@demo.edu",
                "institution", "Demo University",
                "enrollmentDate", "2023-09-01",
                "credentialCount", credentialService.getStudentCredentials(studentId).size()
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "profile", profile
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch student profile", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to fetch profile: " + e.getMessage()
            ));
        }
    }
}
