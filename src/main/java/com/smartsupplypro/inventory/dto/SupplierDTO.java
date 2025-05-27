package com.smartsupplypro.inventory.dto;

import lombok.*;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class SupplierDTO {
    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    private String contactName;

    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "CreatedBy must be provided.")
    private String createdBy;

    private LocalDateTime createdAt;
}
