package com.smartsupplypro.inventory.dto;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.Data;

/**
 * Request filter for stock history search queries.
 *
 * <p>Bound from query parameters by
 * {@link com.smartsupplypro.inventory.controller.StockHistoryController#search()}.
 * All fields are optional; omitted parameters are treated as unconstrained.</p>
 */
@Data
public class StockUpdateFilterDTO {

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endDate;

    private String itemName;
    private String supplierId;
    private String createdBy;
    private Integer minChange;
    private Integer maxChange;
}
