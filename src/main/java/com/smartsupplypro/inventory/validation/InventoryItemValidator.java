package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

import java.math.BigDecimal;

/**
 * Utility class responsible for validating InventoryItem-related input data.
 * <p>
 * Ensures that the data passed into service layers (especially during creation
 * or update operations) adheres to business rules such as:
 * <ul>
 *   <li>Non-null and non-empty names</li>
 *   <li>Non-negative quantities and prices</li>
 *   <li>Mandatory supplier ID and createdBy metadata</li>
 * </ul>
 * </p>
 *
 * <p><strong>Design Note:</strong> This class is intentionally non-instantiable
 * using a private constructor. It provides only static validation methods.</p>
 * 
 * <p><strong>Usage:</strong> Typically called in {@code InventoryItemService} before persisting data.</p>
 * 
 * @author
 * SmartSupplyPro Dev Team
 */
public class InventoryItemValidator {

    /**
     * Private constructor to enforce utility-class pattern.
     * Prevents instantiation of this validator class.
     */
    private InventoryItemValidator() {}

    /**
     * Validates the fundamental fields of an {@link InventoryItemDTO}.
     * Throws {@link IllegalArgumentException} if any required field is missing
     * or contains invalid values.
     *
     * @param dto the DTO representing the inventory item
     * @throws IllegalArgumentException if any validation rule is violated
     */
    public static void validateBase(InventoryItemDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name cannot be null or empty");
        }
        if (dto.getQuantity() < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be positive or greater than zero");
        }
        if (dto.getSupplierId() == null || dto.getSupplierId().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier ID must be provided");
        }
        if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
            throw new IllegalArgumentException("CreatedBy must be provided");
        }
    }

    /**
     * Checks whether an inventory item with the given name already exists.
     * This prevents accidental duplicate entries by enforcing uniqueness on item names.
     *
     * @param name          the name of the inventory item
     * @param inventoryRepo the repository to check for existing entries
     * @throws IllegalArgumentException if a duplicate name is found
     */
    public static void validateInventoryItemNotExists(String name, InventoryItemRepository inventoryRepo) {
        if (inventoryRepo.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("An inventory item with this name already exists.");
        }
    }
}
// This code provides the InventoryItemValidator class, which enforces validation rules for inventory item data.