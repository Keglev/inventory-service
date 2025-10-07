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
 * Supplier entity representing inventory goods providers.
 * Maps to SUPPLIER table with contact information and audit metadata.
 *
 * <p><strong>Purpose</strong>: Tracks supplier information for inventory sourcing and reporting.
 *
 * <p><strong>Usage</strong>: Supplier management, inventory linkage, analytics.
 *
 * @see InventoryItem
 * @see StockHistory
 * @see <a href="../../../../../docs/architecture/patterns/model-patterns.md">Model Patterns</a>
 */
@Entity
@Table(name = "SUPPLIER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {

    /** Unique supplier identifier (UUID or custom code). */
    @Id
    @Column(name="ID", nullable = false)
    private String id;

    /** Supplier company name (unique). */
    @Column(name="NAME", nullable=false)
    private String name;

    /** Contact person name. */
    @Column(name="CONTACT_NAME")
    private String contactName;

    /** Contact phone number. */
    @Column(name="PHONE")
    private String phone;

    /** Contact email address. */
    @Column(name="EMAIL")
    private String email;

    /** User/system that created this record. */
    @Column(name="CREATED_BY", nullable=false)
    private String createdBy;

    /** Timestamp when supplier was added. */
    @CreationTimestamp
    @Column(name="CREATED_AT", nullable=false, updatable=false)
    private LocalDateTime createdAt;
}
