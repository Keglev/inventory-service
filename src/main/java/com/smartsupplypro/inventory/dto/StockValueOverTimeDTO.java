package com.smartsupplypro.inventory.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO representing the total value of inventory on a given date.
 *
 * <p>Used for plotting trends in stock valuation over time,
 * such as in line charts, monthly reports, or KPI dashboards.
 */
@Data
@AllArgsConstructor
public class StockValueOverTimeDTO {

    /**
     * The date associated with the stock value.
     * Typically one entry per day in a time series.
     */
    private LocalDate date;

    /**
     * Total monetary value of all inventory items on the given date.
     * Computed as the sum of (quantity × price) for all items.
     */
    private double totalValue;
}

