package com.trustseal.api.controller;

import com.trustseal.api.service.CredentialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for credential verifiers (employers)
 * 
 * Provides endpoints for employers to verify ZK proofs
 * of student credentials without revealing private information.
 */
@RestController
@RequestMapping("/api/verifier")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class VerifierController {
    
    private final CredentialService credentialService;
    
    /**
     * Verify a ZK proof
     * 
     * This endpoint allows employers to verify that a student
     * possesses a valid credential without seeing the full credential details.
     */
    @PostMapping("/proofs/verify")
    public ResponseEntity<?> verifyProof(
            @RequestBody Map<String, String> request) {
        
        String proofData = request.get("proof");
        String publicInputs = request.get("publicInputs");
        
        if (proofData == null || publicInputs == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Missing required fields: proof, publicInputs"
            ));
        }
        
        log.info("Verifying ZK proof...");
        
        try {
            Boolean isValid = credentialService.verifyProof(proofData, publicInputs).block();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "isValid", isValid,
                "message", isValid ? "Proof verified successfully" : "Proof verification failed",
                "timestamp", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            log.error("Failed to verify proof", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to verify proof: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Verify a credential by QR code data
     * 
     * This endpoint allows employers to scan a QR code and verify
     * the credential directly.
     */
    @PostMapping("/credentials/verify-qr")
    public ResponseEntity<?> verifyCredentialByQR(
            @RequestBody Map<String, String> request) {
        
        String qrCodeData = request.get("qrCodeData");
        
        if (qrCodeData == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Missing required field: qrCodeData"
            ));
        }
        
        log.info("Verifying credential by QR code...");
        
        try {
            // For the hackathon MVP, we'll implement a simplified verification
            // In production, this would decode the QR code and verify the proof
            
            // Mock verification result
            boolean isValid = true; // In production, this would be the actual verification result
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "isValid", isValid,
                "message", isValid ? "Credential verified successfully" : "Credential verification failed",
                "verificationMethod", "QR Code",
                "timestamp", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            log.error("Failed to verify credential by QR code", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to verify credential: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get verification statistics
     * 
     * For demo purposes, returns mock statistics.
     * In production, this would track actual verification metrics.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getVerificationStats() {
        try {
            var stats = Map.of(
                "totalVerifications", 0,
                "successfulVerifications", 0,
                "failedVerifications", 0,
                "successRate", "100%",
                "averageVerificationTime", "0ms",
                "lastVerification", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "stats", stats
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch verification stats", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to fetch stats: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Health check endpoint for verifier service
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "service", "TrustSeal Verifier Service",
            "status", "healthy",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
