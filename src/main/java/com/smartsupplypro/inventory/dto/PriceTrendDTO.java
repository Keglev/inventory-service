package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Historical price trend DTO for individual inventory items over time.
 * Tracks unit price variations for supplier negotiation and market analysis.
 * @see AnalyticsController#getPriceTrend()
 * @see dto-patterns.md for time series patterns
 */
@Data
@AllArgsConstructor
public class PriceTrendDTO {

    /** Date when price was recorded (yyyy-MM-dd format for SQL compatibility). */
    private String timestamp;

    /** Unit purchase price at this point in time. */
    private BigDecimal price;

    // Enterprise Comment: Date format conversion - standardize on yyyy-MM-dd string format
    // for consistent serialization across H2/Oracle databases and frontend charting libraries
    public PriceTrendDTO(LocalDateTime timestamp, BigDecimal price) {
        this.timestamp = timestamp.toLocalDate().toString();
        this.price = price;
    }

}
