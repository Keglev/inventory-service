package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;

/**
 * Response payload for a stock history audit entry.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.StockHistoryController}.</p>
 *
 * @param id            unique audit record identifier
 * @param itemId        inventory item affected by this change
 * @param change        signed quantity delta — positive for inbound, negative for outbound
 * @param reason        stock change reason code
 * @param createdBy     user or process that triggered this change
 * @param timestamp     when this change was recorded
 * @param priceAtChange unit price at time of change, used for value tracking
 */
@Builder
public record StockHistoryDTO(
        String id,
        String itemId,
        int change,
        String reason,
        String createdBy,
        LocalDateTime timestamp,
        BigDecimal priceAtChange
) {}
