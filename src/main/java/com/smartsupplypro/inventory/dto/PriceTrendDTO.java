package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO representing the historical unit price of a specific inventory item.
 *
 * <p>Used for analytics and dashboard visualizations of purchase price trends over time.
 * Each entry reflects the price that was recorded at a specific point when stock was updated.
 *
 * <p>This DTO is typically returned by the {@code /api/analytics/price-trend} endpoint,
 * filtered by item ID and date range.
 *
 * <p>Unlike {@link StockValueOverTimeDTO} which aggregates total stock value,
 * this DTO focuses on unit-level price variation.
 *
 * <p>Example usage:
 * <ul>
 *     <li>Line chart: "How has the purchase price of CPU Model X changed in the last 6 months?"</li>
 *     <li>Supplier negotiation tools based on historical prices</li>
 * </ul>
 */
@Data
@AllArgsConstructor
public class PriceTrendDTO {

    /**
     * The date (formatted as yyyy-MM-dd) when this price was recorded.
     * Returned as a String for compatibility with H2 and Oracle SQL date formats.
     */
    private String timestamp;

    /**
     * The unit purchase price at that point in time.
     * Typically set when new stock is received.
     */
    private BigDecimal price;

    public PriceTrendDTO(LocalDateTime timestamp, BigDecimal price) {
        this.timestamp = timestamp.toLocalDate().toString(); // Format as yyyy-MM-dd
        this.price = price;
    }

}
