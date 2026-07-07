package com.smartsupplypro.inventory.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Service contract for inventory item lifecycle management.
 *
 * <p>Defines CRUD operations, atomic stock and price adjustments,
 * paginated search, and audit trail integration for inventory items.</p>
 *
 * @see InventoryItemServiceImpl
 * @see StockHistoryService
 */
public interface InventoryItemService {

    /**
     * Retrieves all inventory items without pagination.
     * Use {@link #searchItems} for large datasets.
     * @return all inventory items
     */
    List<InventoryItemDTO> getAll();

    /**
     * Retrieves an inventory item by unique identifier.
     * @param id inventory item ID
     * @return item if found, empty otherwise
     */
    Optional<InventoryItemDTO> getById(String id);

    /**
     * Searches active items by partial name or SKU with optional supplier and
     * below-minimum filters. Ordering is taken from the {@link Pageable} sort.
     * @param name             search term (partial match, case-insensitive); empty matches all
     * @param supplierId       optional supplier filter (null = all suppliers)
     * @param belowMinimumOnly when true, only items below their minimum quantity
     * @param pageable         pagination and sorting parameters
     * @return paginated results
     */
    Page<InventoryItemDTO> searchItems(String name, String supplierId,
                                       boolean belowMinimumOnly, Pageable pageable);

    /**
     * Creates a new inventory item with initial stock.
     * Automatically logs an INITIAL_STOCK event to stock history.
     * @param dto inventory item data
     * @return created item with generated ID
     * @throws IllegalArgumentException if validation fails
     */
    InventoryItemDTO save(InventoryItemDTO dto);

    /**
     * Updates an existing inventory item (full update).
     * For atomic stock or price changes use {@link #adjustQuantity} or {@link #updatePrice}.
     * @param id  inventory item ID
     * @param dto updated item data
     * @return updated item if found, empty otherwise
     * @throws IllegalArgumentException if validation fails
     */
    Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto);

    /**
     * Soft-deletes an inventory item: marks it inactive instead of removing
     * the row, preserving its stock history for auditing. Only permitted
     * when the item's quantity is already zero.
     * @param id inventory item ID
     */
    void delete(String id);

    /**
     * Adjusts item quantity by delta and logs the change to stock history.
     * @param id     inventory item ID
     * @param delta  quantity change (positive for additions, negative for reductions)
     * @param reason business reason (e.g. SOLD, DAMAGED, MANUAL_UPDATE)
     * @return updated item with new quantity
     * @throws IllegalArgumentException if resulting quantity would be negative
     */
    InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason);

    /**
     * Updates item unit price and logs a PRICE_CHANGE event to stock history.
     * @param id       inventory item ID
     * @param newPrice new unit price (must be &gt; 0)
     * @return updated item with new price
     * @throws IllegalArgumentException if newPrice &lt;= 0
     */
    InventoryItemDTO updatePrice(String id, BigDecimal newPrice);

    /**
     * Renames an inventory item, validating uniqueness within the same supplier.
     * Only ADMIN users may rename items.
     * @param id      inventory item ID
     * @param newName new item name (must not be empty)
     * @return updated item with new name
     * @throws IllegalArgumentException if name is empty, already exists for this supplier, or item not found
     */
    InventoryItemDTO renameItem(String id, String newName);

    /**
     * Counts total inventory items across all suppliers (KPI).
     * @return total item count
     */
    long countItems();

}
