package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response payload for a single price observation in a trend series.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.AnalyticsController#getPriceTrend()}.</p>
 *
 * <p>{@code timestamp} is stored as {@code yyyy-MM-dd} rather than a full datetime
 * to normalise day-level granularity across database backends and frontend charting libraries.</p>
 */
@Data
@AllArgsConstructor
public class PriceTrendDTO {

    private String timestamp;
    private BigDecimal price;

    /**
     * Constructs a data point from a full event timestamp, truncating to date precision.
     *
     * @param timestamp raw event timestamp; only the date part ({@code yyyy-MM-dd}) is retained
     * @param price     unit price at this event
     */
    public PriceTrendDTO(LocalDateTime timestamp, BigDecimal price) {
        this.timestamp = timestamp.toLocalDate().toString();
        this.price = price;
    }
}
