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

    
    @Id
    @Column(name="ID", nullable = false)
    private String id;

    
    @Column(name="NAME", nullable=false)
    private String name;

    
    @Column(name="CONTACT_NAME")
    private String contactName;

   
    @Column(name="PHONE")
    private String phone;

    
    @Column(name="EMAIL")
    private String email;

    
    @Column(name="CREATED_BY", nullable=false)
    private String createdBy;

    
    @CreationTimestamp
    @Column(name="CREATED_AT", nullable=false, updatable=false)
    private LocalDateTime createdAt;
}