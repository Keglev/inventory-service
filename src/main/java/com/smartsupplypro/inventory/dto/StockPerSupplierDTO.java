package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StockPerSupplierDTO {
    private String supplierName;
    private long totalQuantity;
}
