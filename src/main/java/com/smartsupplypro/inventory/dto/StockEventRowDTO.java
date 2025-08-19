package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Lightweight event used by the cost-flow (WAC) algorithm.
 * Sourced via JPQL over {@code StockHistory} fields (portable across H2/Oracle).
 * not raw DB column names. Column mapping is handled in the entity with @Column(name="created_at").
 *
 * @param itemId         Inventory item ID
 * @param supplierId     Supplier ID (nullable)
 * @param createdAt      Event creation timestamp (entity property mapped to DB created_at)
 * @param change         Signed quantity change (+in / -out)
 * @param priceAtChange  Unit purchase price at the event (nullable for non-purchase events)
 * @param reason         Classified reason for the movement
 */
public record StockEventRowDTO(
        String itemId,
        String supplierId,
        LocalDateTime createdAt,
        int quantityChange,
        BigDecimal priceAtChange,
        StockChangeReason reason
) {}
