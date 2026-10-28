package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.List;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

/**
 * Persistence-backed validators for inventory items.
 *
 * <p>Requires a repository for uniqueness checks.
 * This separation from {@link InventoryItemValidator} is intentional:
 * pure format guards must not make persistence calls.</p>
 *
 * @see InventoryItemValidator
 * @see InventoryItemRepository
 */
public class InventoryItemLookupValidator {

    private InventoryItemLookupValidator() {}

    /**
     * Duplicate name+price check for a new item (create operations).
     *
     * @param name  item name
     * @param price item price
     * @param repo  inventory repository
     * @throws DuplicateResourceException if any item shares the same name and price
     */
    public static void validateInventoryItemNotExists(
            String name, BigDecimal price, InventoryItemRepository repo) {
        List<InventoryItem> matches = repo.findByNameIgnoreCase(name);
        for (InventoryItem item : matches) {
            if (item.getPrice().compareTo(price) == 0) {
                throw new DuplicateResourceException(
                    "An inventory item with this name and price already exists.", "name"
                );
            }
        }
    }

    /**
     * Duplicate SKU check for a new item (create operations).
     *
     * @param sku  item SKU
     * @param repo inventory repository
     * @throws DuplicateResourceException if any item shares the same SKU
     */
    public static void validateSkuNotExists(String sku, InventoryItemRepository repo) {
        if (!repo.findBySkuIgnoreCase(sku).isEmpty()) {
            throw new DuplicateResourceException(
                "An inventory item with this SKU already exists.", "sku"
            );
        }
    }
}
