package com.smartsupplypro.inventory.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

/**
 * Flexible stock history search filter DTO supporting advanced query combinations.
 * Enables precise audit trail filtering with date ranges and entity constraints.
 * @see StockHistoryController#search()
 * @see dto-patterns.md for search filter patterns
 */
@Data
public class StockUpdateFilterDTO {

    /** Optional start date/time for range filtering (ISO 8601). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startDate;

    /** Optional end date/time for range filtering (ISO 8601). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endDate;

    /** Optional item name for case-insensitive search. */
    private String itemName;

    /** Optional supplier ID filter. */
    private String supplierId;

    /** Optional user filter for audit tracking. */
    private String createdBy;

    /** Optional minimum quantity change (inclusive). */
    private Integer minChange;

    /** Optional maximum quantity change (inclusive). */
    private Integer maxChange;
}
// Note: This DTO is designed to be flexible and extensible for future requirements.
