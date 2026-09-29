package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;

/**
 * Response payload for supplier stock distribution analytics.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.AnalyticsController#getStockPerSupplier()}.</p>
 *
 * @param supplierName  display name of the supplier
 * @param totalQuantity total units in stock sourced from this supplier
 * @param totalValue    those units at each item's current unit price
 */
public record StockPerSupplierDTO(
        String supplierName,
        long totalQuantity,
        BigDecimal totalValue
) {}
