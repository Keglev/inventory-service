package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LowStockItemDTO {
    private String itemName;
    private int quantity;
    private int minimumQuantity;
}
