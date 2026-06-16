package com.smartsupplypro.inventory.dto;

import java.time.LocalDateTime;

/**
 * Response payload for an enriched stock update result.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.StockHistoryController#search()}.
 * Supplier and item identifiers are resolved to display names to avoid separate client lookups.</p>
 *
 * @param itemName     display name of the affected inventory item
 * @param supplierName display name of the associated supplier
 * @param change       signed quantity delta — positive for inbound, negative for outbound
 * @param reason       stock change reason classification
 * @param createdBy    user or process that triggered this change
 * @param timestamp    when this change was recorded
 */
public record StockUpdateResultDTO(
        String itemName,
        String supplierName,
        int change,
        String reason,
        String createdBy,
        LocalDateTime timestamp
) {}
