package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;

/**
 * A stock history audit entry as validated before it is written.
 *
 * <p>Built by {@link com.smartsupplypro.inventory.service.impl.StockHistoryServiceImpl#logStockChange}
 * and checked by {@link com.smartsupplypro.inventory.validation.StockHistoryValidator}; no
 * endpoint returns it since the stock-history read API was removed (2026-10-28).</p>
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
