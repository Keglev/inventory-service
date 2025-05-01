package com.smartsupplypro.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "STOCK_HISTORY")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockHistory {
    
    @Id
    private String id;

    @Column(name = "item_id")
    private String itemId;

    private int change;

    private String reason;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
