package com.smartsupplypro.inventory.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * Stock change audit trail DTO capturing inventory modification events.
 * Records what changed, when, why, and who performed each stock operation.
 * @see StockHistoryController
 * @see dto-patterns.md for audit trail patterns
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockHistoryDTO {

    /** Unique audit record identifier. */
    private String id;

    /** Inventory item affected by this change. */
    private String itemId;

    /** Quantity delta (positive for inbound, negative for outbound). */
    private int change;

    /** Reason code for the stock change (enum-based). */
    private String reason;

    /** User or process that triggered this change. */
    private String createdBy;

    /** When this change was recorded. */
    private LocalDateTime timestamp;

    /** Item price at time of change (for value tracking). */
    private BigDecimal priceAtChange;
}

