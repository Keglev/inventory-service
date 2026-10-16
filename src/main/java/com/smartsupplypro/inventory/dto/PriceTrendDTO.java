package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response payload for a single price observation in a trend series.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.StockAnalyticsController#getPriceTrend}.</p>
 *
 * <p>{@code timestamp} is stored as {@code yyyy-MM-dd} rather than a full datetime
 * to normalise day-level granularity across database backends and frontend charting libraries.</p>
 */
@Data
@AllArgsConstructor
public class PriceTrendDTO {

    private String timestamp;
    private BigDecimal price;
}
