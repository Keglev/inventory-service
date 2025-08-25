package com.smartsupplypro.inventory.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

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
    @Column(name="ID", nullable = false)
    private String id;

    /** Supplier's company name (must be unique and not null) */
    @Column(name="NAME", nullable=false)
    private String name;

    /** Contact person's name at the supplier organization */
    @Column(name="CONTACT_NAME")
    private String contactName;

    /** Contact phone number */
     @Column(name="PHONE")
    private String phone;

    /** Contact email address */
    @Column(name="EMAIL")
    private String email;

    /** Identifier of the user or system that created this record */
    @Column(name="CREATED_BY", nullable=false)
    private String createdBy;

    /** Timestamp of when this supplier was added to the system */
    @CreationTimestamp
    @Column(name="CREATED_AT", nullable=false, updatable=false)
    private LocalDateTime createdAt;
}
// This model is designed to be used in service layers where supplier information is managed,
// such as in REST controllers, service classes, and repositories. It provides a clear
// structure for representing suppliers, including their contact details and audit metadata.