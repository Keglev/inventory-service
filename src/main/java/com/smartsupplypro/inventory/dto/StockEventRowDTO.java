package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Immutable stock event used internally for Weighted Average Cost (WAC) calculations.
 *
 * <p>Projected directly from JPQL queries in the analytics service.
 * Not exposed to API clients.</p>
 *
 * @param itemId         inventory item identifier
 * @param supplierId     supplier at time of event; {@code null} for non-purchase events
 * @param createdAt      timestamp of the stock change
 * @param quantityChange signed unit delta — positive for inbound, negative for outbound
 * @param priceAtChange  unit cost at event time; {@code null} for non-purchase events
 * @param reason         classification of the stock movement
 */
public record StockEventRowDTO(
        String itemId,
        String supplierId,
        LocalDateTime createdAt,
        int quantityChange,
        BigDecimal priceAtChange,
        StockChangeReason reason
) {}
