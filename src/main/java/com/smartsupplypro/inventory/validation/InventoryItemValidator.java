package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Utility class responsible for validating InventoryItem-related input data.
 *
 * <p>Ensures that the data passed into service layers (especially during creation
 * or update operations) adheres to business rules such as:
 * <ul>
 *   <li>Non-null and non-empty names</li>
 *   <li>Non-negative quantities and prices</li>
 *   <li>Mandatory supplier ID and createdBy metadata</li>
 * </ul>
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

    private InventoryItemValidator() {
        // Utility class - prevent instantiation
    }

    /**
     * Validates the fundamental fields of an {@link InventoryItemDTO}.
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
     * Validates that no inventory item with the same name and price already exists (for creation).
     *
     * @param name          the name of the inventory item
     * @param price         the price of the inventory item
     * @param inventoryRepo the inventory item repository
     * @throws IllegalArgumentException if duplicate found
     */
    public static void validateInventoryItemNotExists(String name, BigDecimal price, InventoryItemRepository inventoryRepo) {
        List<InventoryItem> existingItems = inventoryRepo.findByNameIgnoreCase(name);
        for (InventoryItem item : existingItems) {
            if (item.getPrice().compareTo(price) == 0) {
                throw new IllegalArgumentException("An inventory item with this name and price already exists.");
            }
        }
    }

    /**
     * Validates that no other inventory item (excluding the one with the same ID) has the same name and price.
     * Used for updates to prevent duplication when changing name or price.
     *
     * @param id            the ID of the current inventory item (being updated)
     * @param name          the proposed new name
     * @param price         the proposed new price
     * @param inventoryRepo the repository to check against
     * @throws IllegalArgumentException if another item with same name and price exists
     */
    public static void validateInventoryItemNotExists(String id, String name, BigDecimal price, InventoryItemRepository inventoryRepo) {
        List<InventoryItem> existingItems = inventoryRepo.findByNameIgnoreCase(name);
        for (InventoryItem item : existingItems) {
            if (!item.getId().equals(id) && item.getPrice().compareTo(price) == 0) {
                throw new IllegalArgumentException("Another inventory item with this name and price already exists.");
            }
        }
    }
}
