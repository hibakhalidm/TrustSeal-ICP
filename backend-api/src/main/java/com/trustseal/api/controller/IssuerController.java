package com.trustseal.api.controller;

import com.trustseal.api.dto.CredentialRequest;
import com.trustseal.api.entity.Credential;
import com.trustseal.api.service.CredentialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

/**
 * Controller for credential issuers (universities)
 * 
 * Provides endpoints for issuing new credentials to students.
 */
@RestController
@RequestMapping("/api/issuer")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class IssuerController {
    
    private final CredentialService credentialService;
    
    /**
     * Issue a new credential
     * 
     * For the hackathon MVP, we use a mock issuer ID from the header.
     * In production, this would be extracted from JWT authentication.
     */
    @PostMapping("/credentials")
    public ResponseEntity<?> issueCredential(
            @Valid @RequestBody CredentialRequest request,
            @RequestHeader(value = "X-User-ID", defaultValue = "1") Long issuerId) {
        
        log.info("Issuing credential for student: {} from issuer: {}", 
                request.getStudentName(), issuerId);
        
        try {
            Credential credential = credentialService.issueCredential(request, issuerId).block();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Credential issued successfully",
                "credentialId", credential.getCredentialId(),
                "credential", credential
            ));
            
        } catch (Exception e) {
            log.error("Failed to issue credential", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to issue credential: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get all credentials issued by an institution
     */
    @GetMapping("/credentials")
    public ResponseEntity<?> getIssuedCredentials(
            @RequestHeader(value = "X-User-ID", defaultValue = "1") Long issuerId,
            @RequestParam(required = false) String institution) {
        
        try {
            // For demo purposes, we'll return all credentials
            // In production, this would filter by the actual issuer
            var credentials = credentialService.getAllCredentials();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "credentials", credentials,
                "count", credentials.size()
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch credentials", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to fetch credentials: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get credential by ID
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
}
