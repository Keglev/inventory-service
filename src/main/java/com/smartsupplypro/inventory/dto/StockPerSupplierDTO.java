package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO representing the total quantity of stock associated with a given supplier.
 *
 * <p>Used in supplier-level analytics, pie/bar charts, or performance dashboards
 * to visualize inventory distribution across suppliers.
 */
@Data
@AllArgsConstructor
public class StockPerSupplierDTO {

    /**
     * The display name of the supplier.
     */
    private String supplierName;

    /**
     * Total quantity of items currently in stock from this supplier.
     */
    private long totalQuantity;
}
// Note: This DTO is designed to be used in analytics and reporting contexts.
