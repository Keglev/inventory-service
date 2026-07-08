package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Pure format and business-rule guards for inventory items.
 *
 * <p>All methods are stateless and make no persistence calls.
 * Validators that require a database check belong in
 * {@link InventoryItemLookupValidator}.</p>
 *
 * @see InventoryItemLookupValidator
 */
public class InventoryItemValidator {

    private InventoryItemValidator() {}

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

    public static void assertPriceValid(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "Price must be greater than zero"
            );
        }
    }

    public static void assertFinalQuantityNonNegative(int resultingQuantity) {
        if (resultingQuantity < 0) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "Resulting stock cannot be negative"
            );
        }
    }

    public static void assertQuantityIsZeroForDeletion(InventoryItem item) {
        if (item.getQuantity() > 0) {
            throw new IllegalStateException(
                "You still have merchandise in stock. " +
                "You need to first remove items from stock by changing quantity."
            );
        }
    }
}
