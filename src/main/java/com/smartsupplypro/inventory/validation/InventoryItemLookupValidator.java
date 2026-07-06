package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

/**
 * Persistence-backed validators for inventory items.
 *
 * <p>Requires a repository for existence and uniqueness checks.
 * This separation from {@link InventoryItemValidator} is intentional:
 * pure format guards must not make persistence calls.</p>
 *
 * @see InventoryItemValidator
 * @see InventoryItemRepository
 */
public class InventoryItemLookupValidator {

    private InventoryItemLookupValidator() {}

    /**
     * Returns the item if found; throws 404 otherwise.
     *
     * @param id   the item identifier
     * @param repo inventory repository
     * @return the found entity
     * @throws ResponseStatusException 404 if absent
     */
    public static InventoryItem validateExists(String id, InventoryItemRepository repo) {
        return repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found: " + id)
        );
    }

    /**
     * Duplicate name+price check that excludes the item with {@code excludeId}.
     * Use during create operations when the incoming item's own ID is known.
     *
     * @param excludeId id to skip when scanning matches (prevents self-conflict)
     * @param name      item name
     * @param price     item price
     * @param repo      inventory repository
     * @throws DuplicateResourceException if a different item shares the same name and price
     */
    public static void validateInventoryItemNotExists(
            String excludeId, String name, BigDecimal price, InventoryItemRepository repo) {
        List<InventoryItem> matches = repo.findByNameIgnoreCase(name);
        for (InventoryItem item : matches) {
            if (!item.getId().equals(excludeId) && item.getPrice().compareTo(price) == 0) {
                throw new DuplicateResourceException(
                    "Another inventory item with this name and price already exists."
                );
            }
        }
    }

    /**
     * Duplicate name+price check with no ID exclusion.
     * Use during update operations when the call site does not need to exclude self.
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
                    "An inventory item with this name and price already exists."
                );
            }
        }
    }

    /**
     * Duplicate SKU check that excludes the item with {@code excludeId}.
     * Use during update operations when the incoming item's own ID is known.
     *
     * @param excludeId id to skip when scanning matches (prevents self-conflict)
     * @param sku       item SKU
     * @param repo      inventory repository
     * @throws DuplicateResourceException if a different item shares the same SKU
     */
    public static void validateSkuNotExists(
            String excludeId, String sku, InventoryItemRepository repo) {
        List<InventoryItem> matches = repo.findBySkuIgnoreCase(sku);
        for (InventoryItem item : matches) {
            if (!item.getId().equals(excludeId)) {
                throw new DuplicateResourceException(
                    "Another inventory item with this SKU already exists."
                );
            }
        }
    }

    /**
     * Duplicate SKU check with no ID exclusion. Use during create operations.
     *
     * @param sku  item SKU
     * @param repo inventory repository
     * @throws DuplicateResourceException if any item shares the same SKU
     */
    public static void validateSkuNotExists(String sku, InventoryItemRepository repo) {
        if (!repo.findBySkuIgnoreCase(sku).isEmpty()) {
            throw new DuplicateResourceException(
                "An inventory item with this SKU already exists."
            );
        }
    }
}
