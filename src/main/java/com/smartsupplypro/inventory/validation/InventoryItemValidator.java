package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

/**
 * Validation utilities for inventory item operations.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>Base Validation</strong>: Name, quantity, price, supplier ID, audit fields</li>
 *   <li><strong>Duplicate Detection</strong>: Name + price uniqueness enforcement</li>
 *   <li><strong>Existence Checks</strong>: Validates item exists before update/delete</li>
 *   <li><strong>Quantity Safety</strong>: Ensures non-negative stock after adjustments</li>
 *   <li><strong>Price Validation</strong>: Strictly positive price enforcement</li>
 * </ul>
 *
 * @see InventoryItemService
 * @see <a href="file:../../../../../../docs/architecture/patterns/validation-patterns.md">Validation Patterns</a>
 */
public class InventoryItemValidator {
    
    private InventoryItemValidator() {
        // Utility class - prevent instantiation
    }
    
    /**
     * Validates fundamental inventory item fields (name, quantity, price, supplier, audit).
     *
     * @param dto inventory item data
     * @throws IllegalArgumentException if validation fails
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
     * Validates no duplicate item exists with same name and price (for creation).
     *
     * @param id inventory item ID (current item to exclude)
     * @param name item name
     * @param price item price
     * @param inventoryRepo inventory repository
     * @throws DuplicateResourceException if duplicate found
     */
    public static void validateInventoryItemNotExists(
    String id, String name, BigDecimal price, InventoryItemRepository inventoryRepo) {
        List<InventoryItem> existingItems = inventoryRepo.findByNameIgnoreCase(name);
        for (InventoryItem item : existingItems) {
            if (!item.getId().equals(id) && item.getPrice().compareTo(price) == 0) {
                throw new DuplicateResourceException(
                "Another inventory item with this name and price already exists."
                );
            }
        }
    }
    
    /**
     * Validates no duplicate item exists with same name and price (for updates).
     *
     * @param name item name
     * @param price item price
     * @param inventoryRepo inventory repository
     * @throws DuplicateResourceException if duplicate found
     */
    public static void validateInventoryItemNotExists(
    String name, BigDecimal price, InventoryItemRepository inventoryRepo) {
        List<InventoryItem> existingItems = inventoryRepo.findByNameIgnoreCase(name);
        for (InventoryItem item : existingItems) {
            if (item.getPrice().compareTo(price) == 0) {
                throw new DuplicateResourceException(
                "An inventory item with this name and price already exists."
                );
            }
        }
    }
    
    /**
     * Validates inventory item exists by ID before update/delete operations.
     *
     * @param id inventory item ID
     * @param inventoryRepo inventory repository
     * @return found inventory item entity
     * @throws ResponseStatusException 404 if not found
     */
    public static InventoryItem validateExists(String id, InventoryItemRepository inventoryRepo) {
        return inventoryRepo.findById(id).orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found: " + id)
        );
    }
    
    /**
     * Validates resulting quantity is non-negative after adjustment.
     *
     * @param resultingQuantity quantity after delta application
     * @throws ResponseStatusException 422 if negative
     */
    public static void assertFinalQuantityNonNegative(int resultingQuantity) {
        if (resultingQuantity < 0) {
            throw new ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "Resulting stock cannot be negative"
            );
        }
    }
    
    /**
     * Validates price is strictly positive (for update/patch operations).
     *
     * @param price price to validate
     * @throws ResponseStatusException 422 if null or not positive
     */
    public static void assertPriceValid(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "Price must be greater than zero"
            );
        }
    }

    /**
     * Validates that quantity is zero before deletion (business rule).
     * Items can only be deleted when all stock has been removed.
     *
     * @param item inventory item to validate
     * @throws IllegalStateException if quantity is greater than zero
     */
    public static void assertQuantityIsZeroForDeletion(InventoryItem item) {
        if (item.getQuantity() > 0) {
            throw new IllegalStateException(
                "You still have merchandise in stock. " +
                "You need to first remove items from stock by changing quantity."
            );
        }
    }
}
