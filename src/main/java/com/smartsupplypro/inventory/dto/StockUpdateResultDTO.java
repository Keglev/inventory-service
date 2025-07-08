package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO representing a single stock update event with human-readable details.
 *
 * <p>This is typically the result of a filtered search using {@link StockUpdateFilterDTO},
 * and is designed to present enriched data (item name, supplier name) rather than just IDs.
 *
 * <p>Useful in reporting tables, CSV/Excel exports, audit views, and admin dashboards.
 */
@Data
@AllArgsConstructor
public class StockUpdateResultDTO {

    /**
     * Display name of the inventory item affected.
     */
    private String itemName;

    /**
     * Display name of the supplier associated with the item.
     */
    private String supplierName;

    /**
     * Quantity changed (positive for additions, negative for removals).
     */
    private int change;

    /**
     * Reason for the stock change (e.g., RECEIVED, SOLD, SCRAPPED).
     */
    private String reason;

    /**
     * User or system process that triggered the change.
     */
    private String createdBy;

    /**
     * Timestamp when the stock change was recorded.
     */
    private LocalDateTime timestamp;
}
// Note: This DTO is designed to be used in contexts where human-readable information is preferred.