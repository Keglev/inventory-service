package com.smartsupplypro.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing a stock movement event, such as an item being received,
 * sold, scrapped, or manually adjusted.
 *
 * <p>Each record captures the reason, quantity change, and the user responsible.
 * This audit trail is essential for analytics, compliance, and inventory debugging.
 *
 * <p>Maps to the {@code STOCK_HISTORY} table in the database.
 */
@Entity
@Table(name = "STOCK_HISTORY")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockHistory {

    /** Unique identifier for the stock history event (UUID or external key) */
    @Id
    private String id;

    /** Foreign key reference to the affected inventory item */
    @Column(name = "item_id")
    private String itemId;

    /**
     * Quantity change recorded in this event.
     * Can be positive (e.g., RECEIVED) or negative (e.g., SOLD, SCRAPPED).
     */
    private int change;

    /**
     * Reason for the stock change, stored as a string to preserve flexibility.
     * Should correspond to a value in the {@link com.smartsupplypro.inventory.enums.StockChangeReason} enum.
     */
    private String reason;

    /** Identifier of the user who initiated the stock change */
    @Column(name = "created_by")
    private String createdBy;

    /** Timestamp when the stock change occurred */
    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    /**
     * Auto-sets the timestamp if not manually provided.
     * Executed before the entity is persisted to the database.
     */
    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
// This entity is designed to be used in service layers where inventory changes need to be tracked,
// such as in inventory management systems, reporting services, and audit logs. It provides a
// structured way to capture historical changes to stock levels, allowing for detailed analysis
// and reporting on inventory movements. The use of JPA annotations ensures that the entity is
// correctly mapped to the database schema, while Lombok annotations reduce boilerplate code for
// getters, setters, and constructors. This model can be easily extended in the future to include
// additional fields or relationships, such as linking to a specific warehouse or location if needed.