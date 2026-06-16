package com.smartsupplypro.inventory.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Supplier payload used for both create and update operations.
 *
 * <p>Submitted to and returned by
 * {@link com.smartsupplypro.inventory.controller.SupplierController}.</p>
 */
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
