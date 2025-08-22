package com.trustseal.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * TrustSeal ICP API Service
 * 
 * Main Spring Boot application that provides REST APIs for:
 * - Credential issuance (for universities)
 * - Credential retrieval (for students)
 * - Proof verification (for employers)
 * 
 * This service acts as the main orchestrator and communicates with
 * the credential-worker-service for ZK proof operations.
 */
@SpringBootApplication
public class TrustSealApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrustSealApiApplication.class, args);
    }

    /**
     * WebClient bean for making HTTP calls to the credential worker service
     */
    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:3001") // Worker service URL
                .build();
    }
}
