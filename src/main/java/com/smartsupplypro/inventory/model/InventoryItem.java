package com.smartsupplypro.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "INVENTORY_ITEM")
@Data
@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor

public class InventoryItem {

    @Id
    private String id;

    @Column(unique = true)
    private String name;

    private int quantity;

    private BigDecimal price;

    @Column(name = "supplier_id")
    private String supplierId;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", insertable = false, updatable = false)
    private Supplier supplier;
}

