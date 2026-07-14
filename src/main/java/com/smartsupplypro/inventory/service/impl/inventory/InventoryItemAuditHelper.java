package com.smartsupplypro.inventory.service.impl.inventory;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.security.SecurityAuditHelper;
import com.smartsupplypro.inventory.service.StockHistoryService;

import lombok.RequiredArgsConstructor;

/**
 * Audit trail helper for inventory item operations.
 *
 * <p>Centralises stock history logging for initial stock, quantity adjustments,
 * price changes, and full removals. All entries capture: itemId, quantityDelta,
 * reason, username, and price snapshot.</p>
 *
 * @see StockHistoryService
 */
@Component
@RequiredArgsConstructor
public class InventoryItemAuditHelper {

    private final StockHistoryService stockHistoryService;

    /**
     * Logs an INITIAL_STOCK entry with the full opening quantity and price snapshot.
     * @param item the newly created inventory item
     */
    public void logInitialStock(InventoryItem item) {
        stockHistoryService.logStockChange(
                item.getId(),
                item.getQuantity(),
                StockChangeReason.INITIAL_STOCK,
                SecurityAuditHelper.currentUsername(),
                item.getPrice()
        );
    }

    /**
     * Logs a MANUAL_UPDATE entry when the quantity actually changed.
     * No entry is created for zero-delta updates to keep the audit trail clean.
     *
     * @param item          the updated item
     * @param quantityDelta the quantity change (positive or negative)
     */
    public void logQuantityChange(InventoryItem item, int quantityDelta) {
        if (quantityDelta != 0) {
            stockHistoryService.logStockChange(
                    item.getId(),
                    quantityDelta,
                    StockChangeReason.MANUAL_UPDATE,
                    SecurityAuditHelper.currentUsername(),
                    item.getPrice()
            );
        }
    }

    /**
     * Logs a quantity adjustment with an explicit reason code.
     * @param item   the item being adjusted
     * @param delta  the quantity change
     * @param reason the business reason for the adjustment
     */
    public void logQuantityAdjustment(InventoryItem item, int delta, StockChangeReason reason) {
        stockHistoryService.logStockChange(
                item.getId(),
                delta,
                reason,
                SecurityAuditHelper.currentUsername(),
                item.getPrice()
        );
    }

    /**
     * Logs a PRICE_CHANGE entry with a zero quantity delta to preserve the price history timeline.
     * @param itemId   the item identifier
     * @param newPrice the new unit price
     */
    public void logPriceChange(String itemId, BigDecimal newPrice) {
        stockHistoryService.logStockChange(
                itemId,
                0,
                StockChangeReason.PRICE_CHANGE,
                SecurityAuditHelper.currentUsername(),
                newPrice
        );
    }

}
