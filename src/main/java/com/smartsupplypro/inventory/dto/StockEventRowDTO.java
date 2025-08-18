package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Lightweight event row for cost-flow processing.
 * Sourced from StockHistory via JPQL (entity fields, not raw column names).
 */
public record StockEventRowDTO(
        String itemId,
        String supplierId,
        LocalDateTime timestamp,
        int change,                    // +in, -out
        BigDecimal priceAtChange,      // unit purchase price (nullable)
        StockChangeReason reason
) {}
