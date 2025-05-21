package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MonthlyStockMovementDTO {
     private String month;         // Format: YYYY-MM
    private long stockIn;         // Total quantity added
    private long stockOut;        // Total quantity removed (absolute value)
}
