package com.smartsupplypro.inventory.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

/**
 * DTO representing a flexible filter for querying stock history records.
 *
 * <p>Used in both GET and POST endpoints to support advanced search capabilities
 * in reporting dashboards and audit views.
 *
 * <p>All fields are optional and can be combined for precise queries.
 */
@Data
public class StockUpdateFilterDTO {

    /**
     * Optional start of the date/time range to filter records.
     * Format: ISO 8601 (e.g., 2025-07-01T00:00:00)
     */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startDate;

    /**
     * Optional end of the date/time range to filter records.
     * Format: ISO 8601.
     */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endDate;

    /**
     * Optional partial or full name of the inventory item.
     * Enables case-insensitive or fuzzy search in services.
     */
    private String itemName;

    /**
     * Optional supplier ID to restrict results to a single supplier.
     */
    private String supplierId;

    /**
     * Optional user ID or username who triggered the stock change.
     * Useful for audit tracking and activity history.
     */
    private String createdBy;

    /**
     * Optional lower bound on the quantity change (inclusive).
     * E.g., to find only significant stock increases.
     */
    private Integer minChange;

    /**
     * Optional upper bound on the quantity change (inclusive).
     * E.g., to exclude extreme spikes or detect small adjustments.
     */
    private Integer maxChange;
}
// Note: This DTO is designed to be flexible and extensible for future requirements.
