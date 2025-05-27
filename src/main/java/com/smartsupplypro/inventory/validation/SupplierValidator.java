package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.SupplierDTO;
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
            throw new com.smartsupplypro.inventory.exception.DuplicateResourceException("A Supplier with this name already exists.");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier name cannot be null or empty");
        }
    }

    public static void validateBase(SupplierDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier name must be provided.");
        }
        if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
            throw new IllegalArgumentException("CreatedBy must be provided.");
        }
    }
}
