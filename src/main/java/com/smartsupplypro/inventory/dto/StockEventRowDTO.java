package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Immutable stock event record for WAC cost-flow algorithm processing.
 * Optimized for financial calculations with portable JPQL field mapping.
 * @see dto-patterns.md for record pattern and WAC algorithm documentation
 */
public record StockEventRowDTO(
        /** Inventory item identifier. */
        String itemId,
        /** Supplier identifier (nullable). */
        String supplierId,
        /** Event timestamp (mapped from entity created_at). */
        LocalDateTime createdAt,
        /** Signed quantity change (+inbound/-outbound). */
        int quantityChange,
        /** Unit price at event time (nullable for non-purchase events). */
        BigDecimal priceAtChange,
        /** Classified reason for stock movement. */
        StockChangeReason reason
) {
    // Enterprise Comment: Record pattern for WAC algorithm - immutable event data structure
    // optimizes memory usage and thread safety for financial calculations
}
