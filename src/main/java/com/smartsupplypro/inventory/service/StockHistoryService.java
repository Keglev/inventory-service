package com.smartsupplypro.inventory.service;

import java.math.BigDecimal;

import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Service contract for immutable stock movement event logging and audit trail management.
 *
 * <p>Logs stock changes with price snapshots. The history is read through the
 * analytics repositories; the direct read API was removed after the access log
 * showed no caller (2026-10-28).</p>
 *
 * @see com.smartsupplypro.inventory.service.impl.StockHistoryServiceImpl
 * @see com.smartsupplypro.inventory.model.StockHistory
 * @see com.smartsupplypro.inventory.validation.StockHistoryValidator
 */
public interface StockHistoryService {

    /**
     * Logs a stock change with a price snapshot for WAC analytics.
     * @param itemId        inventory item ID
     * @param change        quantity change (positive or negative)
     * @param reason        business reason for change
     * @param createdBy     user who initiated change
     * @param priceAtChange unit price at time of change (nullable)
     * @throws com.smartsupplypro.inventory.exception.InvalidRequestException if the record fails
     *         validation, including a null {@code reason}
     */
    void logStockChange(String itemId,
                        int change,
                        StockChangeReason reason,
                        String createdBy,
                        BigDecimal priceAtChange);
}
