package com.trustseal.api.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * DTO for credential issuance requests
 */
@Data
public class CredentialRequest {
    
    @NotBlank(message = "Student name is required")
    private String studentName;
    
    @NotBlank(message = "Degree is required")
    private String degree;
    
    @NotBlank(message = "Institution is required")
    private String institution;
    
    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;
    
    @NotBlank(message = "Student ID is required")
    private String studentId;
    
    @NotBlank(message = "Student email is required")
    private String studentEmail;
}
