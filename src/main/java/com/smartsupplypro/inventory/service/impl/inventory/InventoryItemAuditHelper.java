package com.smartsupplypro.inventory.service.impl.inventory;

import java.math.BigDecimal;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.service.StockHistoryService;

import lombok.RequiredArgsConstructor;

/**
 * Audit trail helper for inventory item operations.
 *
 * <p>Centralizes stock history logging patterns:
 * <ul>
 *   <li>Initial stock logging (INITIAL_STOCK reason)</li>
 *   <li>Quantity adjustments (MANUAL_UPDATE reason)</li>
 *   <li>Price changes (PRICE_CHANGE reason with delta=0)</li>
 *   <li>Full removals (deletion reasons with negative quantity)</li>
 * </ul>
 *
 * <p>All audit entries capture: itemId, quantityDelta, reason, username, price snapshot.
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Component
@RequiredArgsConstructor
public class InventoryItemAuditHelper {

    private final StockHistoryService stockHistoryService;

    /**
     * Logs initial stock entry for newly created item.
     *
     * <p>Creates INITIAL_STOCK entry with full quantity and price snapshot.
     *
     * @param item the newly created inventory item
     */
    public void logInitialStock(InventoryItem item) {
        stockHistoryService.logStockChange(
                item.getId(),
                item.getQuantity(),
                StockChangeReason.INITIAL_STOCK,
                currentUsername(),
                item.getPrice()
        );
    }

    /**
     * Logs quantity adjustment if delta is non-zero.
     *
     * <p>Creates MANUAL_UPDATE entry only if quantity changed.
     *
     * @param item the updated item
     * @param quantityDelta the quantity change (positive or negative)
     */
    public void logQuantityChange(InventoryItem item, int quantityDelta) {
        if (quantityDelta != 0) {
            stockHistoryService.logStockChange(
                    item.getId(),
                    quantityDelta,
                    StockChangeReason.MANUAL_UPDATE,
                    currentUsername(),
                    item.getPrice()
            );
        }
    }

    /**
     * Logs quantity adjustment with specific reason.
     *
     * @param item the item being adjusted
     * @param delta the quantity change
     * @param reason the business reason for adjustment
     */
    public void logQuantityAdjustment(InventoryItem item, int delta, StockChangeReason reason) {
        stockHistoryService.logStockChange(
                item.getId(),
                delta,
                reason,
                currentUsername(),
                item.getPrice()
        );
    }

    /**
     * Logs price change with zero quantity delta.
     *
     * <p>Creates PRICE_CHANGE entry to preserve price history timeline.
     *
     * @param itemId the item identifier
     * @param newPrice the new unit price
     */
    public void logPriceChange(String itemId, BigDecimal newPrice) {
        stockHistoryService.logStockChange(
                itemId,
                0,
                StockChangeReason.PRICE_CHANGE,
                currentUsername(),
                newPrice
        );
    }

    /**
     * Logs full stock removal before item deletion.
     *
     * @param item the item being deleted
     * @param reason the deletion reason
     */
    public void logFullRemoval(InventoryItem item, StockChangeReason reason) {
        stockHistoryService.logStockChange(
                item.getId(),
                -item.getQuantity(),
                reason,
                currentUsername(),
                item.getPrice()
        );
    }

    /**
     * Retrieves current authenticated username.
     *
     * @return authenticated username, or "system" if no authentication present
     */
    private String currentUsername() {
        Authentication a = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication() : null;
        return a != null ? a.getName() : "system";
    }
}
