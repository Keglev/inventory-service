package com.smartsupplypro.inventory.dto;


import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class InventoryItemDTO {
    private String id;
    private String name;
    private int quantity;
    private BigDecimal price;
    private BigDecimal totalValue; // Computed field
    private String supplierId;
    private String createdBy;
    private LocalDateTime createdAt;
}
