package com.trustseal.api.service;

import com.trustseal.api.dto.CredentialRequest;
import com.trustseal.api.entity.Credential;
import com.trustseal.api.entity.User;
import com.trustseal.api.repository.CredentialRepository;
import com.trustseal.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing credentials in the TrustSeal system
 * 
 * This service orchestrates credential operations and communicates
 * with the credential-worker-service for ZK proof operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CredentialService {
    
    private final CredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final WebClient webClient;
    
    /**
     * Issue a new credential
     */
    public Mono<Credential> issueCredential(CredentialRequest request, Long issuerId) {
        log.info("Issuing credential for student: {} from institution: {}", 
                request.getStudentName(), request.getInstitution());
        
        return Mono.fromCallable(() -> {
            // Get or create the student user
            User student = getOrCreateStudent(request);
            
            // Get the issuer user
            User issuer = userRepository.findById(issuerId)
                    .orElseThrow(() -> new RuntimeException("Issuer not found"));
            
            // Call the worker service to create the credential and generate ZK proof
            return callWorkerService(request, student, issuer);
            
        }).flatMap(credential -> {
            // Save the credential to our database
            return Mono.just(credentialRepository.save(credential));
        });
    }
    
    /**
     * Get all credentials for a student
     */
    public List<Credential> getStudentCredentials(String studentId) {
        log.info("Fetching credentials for student: {}", studentId);
        return credentialRepository.findByStudentStudentId(studentId);
    }
    
    /**
     * Get credential by ID
     */
    public Optional<Credential> getCredentialById(Long id) {
        return credentialRepository.findById(id);
    }
    
    /**
     * Verify a ZK proof
     */
    public Mono<Boolean> verifyProof(String proofData, String publicInputs) {
        log.info("Verifying ZK proof...");
        
        return webClient.post()
                .uri("/verify")
                .bodyValue(Map.of(
                    "proof", proofData,
                    "publicInputs", publicInputs
                ))
                .retrieve()
                .bodyToM(Map.class)
                .map(response -> (Boolean) response.get("isValid"))
                .onErrorReturn(false);
    }
    
    /**
     * Get or create a student user
     */
    private User getOrCreateStudent(CredentialRequest request) {
        return userRepository.findByStudentId(request.getStudentId())
                .orElseGet(() -> {
                    User newStudent = new User();
                    newStudent.setUsername(request.getStudentEmail());
                    newStudent.setEmail(request.getStudentEmail());
                    newStudent.setFullName(request.getStudentName());
                    newStudent.setRole(User.UserRole.STUDENT);
                    newStudent.setInstitution(request.getInstitution());
                    newStudent.setStudentId(request.getStudentId());
                    return userRepository.save(newStudent);
                });
    }
    
    /**
     * Call the worker service to create credential and generate ZK proof
     */
    private Credential callWorkerService(CredentialRequest request, User student, User issuer) {
        // Prepare the request for the worker service
        Map<String, Object> workerRequest = Map.of(
            "studentName", request.getStudentName(),
            "degree", request.getDegree(),
            "institution", request.getInstitution(),
            "issueDate", request.getIssueDate().toString(),
            "studentId", request.getStudentId()
        );
        
        // Call the worker service
        Map<String, Object> response = webClient.post()
                .uri("/issue")
                .bodyValue(workerRequest)
                .retrieve()
                .bodyToM(Map.class)
                .block();
        
        if (response == null || !(Boolean) response.get("success")) {
            throw new RuntimeException("Failed to create credential in worker service");
        }
        
        // Create the credential entity
        Credential credential = new Credential();
        credential.setCredentialId((String) response.get("credentialId"));
        credential.setStudent(student);
        credential.setIssuer(issuer);
        credential.setDegree(request.getDegree());
        credential.setInstitution(request.getInstitution());
        credential.setIssueDate(request.getIssueDate().atStartOfDay());
        credential.setStatus(Credential.Status.ISSUED);
        credential.setProofData(response.get("proof").toString());
        credential.setQrCodeData((String) response.get("qrCode"));
        
        return credential;
    }
    
    /**
     * Get all credentials (for demo purposes)
     */
    public List<Credential> getAllCredentials() {
        return credentialRepository.findAll();
    }
    
    /**
     * Get credentials by institution
     */
    public List<Credential> getCredentialsByInstitution(String institution) {
        return credentialRepository.findByInstitution(institution);
    }
}
