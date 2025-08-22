package com.trustseal.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Credential entity representing digital credentials in the TrustSeal system
 * 
 * This entity stores metadata about credentials and references to the
 * actual credential data stored by the worker service.
 */
@Entity
@Table(name = "credentials")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Credential {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String credentialId; // External ID from worker service
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issuer_id", nullable = false)
    private User issuer;
    
    @Column(nullable = false)
    private String degree;
    
    @Column(nullable = false)
    private String institution;
    
    @Column(nullable = false)
    private LocalDateTime issueDate;
    
    @Column(nullable = false)
    private String status; // ISSUED, REVOKED, EXPIRED
    
    @Column(columnDefinition = "TEXT")
    private String proofData; // JSON string of ZK proof data
    
    @Column(columnDefinition = "TEXT")
    private String qrCodeData; // Base64 encoded QR code
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Credential status values
     */
    public static class Status {
        public static final String ISSUED = "ISSUED";
        public static final String REVOKED = "REVOKED";
        public static final String EXPIRED = "EXPIRED";
    }
}
