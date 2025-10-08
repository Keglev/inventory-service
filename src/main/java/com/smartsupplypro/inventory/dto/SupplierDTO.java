package com.smartsupplypro.inventory.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Supplier entity DTO with validation for CRUD operations and audit support.
 * Used for supplier registration, editing, and selection in inventory workflows.
 * @see SupplierController
 * @see dto-patterns.md for audit trail patterns
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDTO {

    /** Unique supplier identifier (system-generated). */
    private String id;

    /** Supplier display name. */
    @NotBlank(message = "Name is required")
    private String name;

    /** Optional contact person name. */
    private String contactName;

    /** Optional phone number. */
    private String phone;

    /** Optional email address with format validation. */
    @Email(message = "Invalid email format")
    private String email;

    /** User who created this supplier (audit trail). */
    @NotBlank(message = "CreatedBy must be provided.")
    private String createdBy;

    /** Creation timestamp (system-generated). */
    private LocalDateTime createdAt;
}

