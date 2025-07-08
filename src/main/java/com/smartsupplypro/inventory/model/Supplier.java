package com.smartsupplypro.inventory.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing a supplier in the inventory system.
 *
 * <p>Suppliers provide goods that are tracked in the inventory.
 * Each supplier has a unique ID, basic contact information, and metadata
 * such as who created the entry and when.
 *
 * <p>Mapped to the {@code SUPPLIER} table in the database.
 */
@Entity
@Table(name = "SUPPLIER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {

    /** Unique identifier for the supplier (UUID or custom code) */
    @Id
    private String id;

    /** Supplier's company name (must be unique and not null) */
    private String name;

    /** Contact person's name at the supplier organization */
    private String contactName;

    /** Contact phone number */
    private String phone;

    /** Contact email address */
    private String email;

    /** Identifier of the user or system that created this record */
    private String createdBy;

    /** Timestamp of when this supplier was added to the system */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
// This model is designed to be used in service layers where supplier information is managed,
// such as in REST controllers, service classes, and repositories. It provides a clear
// structure for representing suppliers, including their contact details and audit metadata.