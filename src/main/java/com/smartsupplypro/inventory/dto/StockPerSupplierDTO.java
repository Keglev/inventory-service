package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Supplier stock distribution DTO for analytics and performance visualization.
 * Shows inventory quantities aggregated by supplier for dashboard charts.
 * @see AnalyticsController#getStockPerSupplier()
 * @see dto-patterns.md for supplier analytics patterns
 */
@Data
@AllArgsConstructor
public class StockPerSupplierDTO {

    /** Supplier display name for analytics visualization. */
    private String supplierName;

    /** Total stock quantity from this supplier. */
    private long totalQuantity;
}
