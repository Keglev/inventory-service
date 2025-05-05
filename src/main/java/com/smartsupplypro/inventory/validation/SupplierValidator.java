package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;

public class SupplierValidator {
    private SupplierValidator() {}

    public static void validateDeletable(String supplierId, InventoryItemRepository inventoryRepo) {
        if (inventoryRepo.existsBySupplierId(supplierId)) {
            throw new IllegalStateException("Cannot delete supplier with existing inventory items.");
        }
    }

    public static void validateSupplierExists(String name, SupplierRepository supplierRepository) {
        if (supplierRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("A Supplier with this name already exists.");
        }
    }
}
