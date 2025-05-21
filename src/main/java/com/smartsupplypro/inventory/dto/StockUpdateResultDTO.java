package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class StockUpdateResultDTO {
    private String itemName;
    private String supplierName;
    private int change;
    private String reason;
    private String createdBy;
    private LocalDateTime timestamp;
}
