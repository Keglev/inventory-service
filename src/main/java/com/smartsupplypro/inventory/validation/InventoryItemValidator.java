package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;

import java.math.BigDecimal;

public class InventoryItemValidator {
    private InventoryItemValidator() {} // Utility class pattern

    public static void validateBase(InventoryItemDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name cannot be null or empty");
        }
        if (dto.getQuantity() < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price must be positive");
        }
        if (dto.getSupplierId() == null || dto.getSupplierId().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier ID must be provided");
        }
    }
}
