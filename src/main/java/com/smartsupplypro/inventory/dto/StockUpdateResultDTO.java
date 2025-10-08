package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Enriched stock update result DTO with human-readable details for reporting.
 * Provides display names instead of IDs for audit views and export functionality.
 * @see StockHistoryController#search()
 * @see dto-patterns.md for result enrichment patterns
 */
@Data
@AllArgsConstructor
public class StockUpdateResultDTO {

    /** Item display name (enriched from ID). */
    private String itemName;

    /** Supplier display name (enriched from ID). */
    private String supplierName;

    /** Quantity delta (positive inbound, negative outbound). */
    private int change;

    /** Stock change reason classification. */
    private String reason;

    /** User or process that triggered this change. */
    private String createdBy;

    /** When this change was recorded. */
    private LocalDateTime timestamp;
}