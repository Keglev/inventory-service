package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.repository.InventoryItemRepository;

public class SupplierValidator {
    private SupplierValidator() {}

    public static void validateDeletable(String supplierId, InventoryItemRepository inventoryRepo) {
        if (inventoryRepo.existsBySupplierId(supplierId)) {
            throw new IllegalStateException("Cannot delete supplier with existing inventory items.");
        }
    }
}
