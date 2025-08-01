package com.smartsupplypro.inventory.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * DTO representing a single historical stock change event for an inventory item.
 *
 * <p>Used for audit trails, historical analysis, and change logs in the inventory system.
 * Each entry captures what changed, why, when, and who performed the action.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockHistoryDTO {

    /**
     * Unique identifier for the stock history record.
     */
    private String id;

    /**
     * The ID of the inventory item affected by the stock change.
     */
    private String itemId;

    /**
     * Quantity changed — can be positive (inbound) or negative (outbound).
     */
    private int change;

    /**
     * Reason for the stock change (e.g., RECEIVED, SOLD, SCRAPPED).
     */
    private String reason;

    /**
     * The user or system process that triggered the change.
     */
    private String createdBy;

    /**
     * Timestamp when the change was recorded.
     */
    private LocalDateTime timestamp;

    /**
     * The price of the item at the time of this stock change.
     * Useful for tracking value changes over time.
     */
    private BigDecimal priceAtChange;
}

