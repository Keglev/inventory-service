package com.smartsupplypro.inventory.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Service interface for inventory item management operations.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>CRUD Operations</strong>: Create, read, update, delete inventory items</li>
 *   <li><strong>Stock Adjustments</strong>: Atomic quantity changes with reason codes</li>
 *   <li><strong>Price Updates</strong>: Unit price changes with audit trail</li>
 *   <li><strong>Search &amp; Pagination</strong>: Name-based search with paginated results</li>
 *   <li><strong>Audit Trail</strong>: All changes logged to stock history automatically</li>
 * </ul>
 *
 * @see StockHistoryService
 * @see InventoryItemServiceImpl
 */
public interface InventoryItemService {

    /**
     * Retrieves all inventory items without pagination.
     * Use paginated search for large datasets.
     *
     * @return all inventory items
     */
    List<InventoryItemDTO> getAll();

    /**
     * Retrieves inventory item by unique identifier.
     *
     * @param id inventory item ID
     * @return item if found, empty otherwise
     */
    Optional<InventoryItemDTO> getById(String id);

    /**
     * Searches items by partial name with pagination, sorted by price ascending.
     *
     * @param name search term (partial match, case-insensitive)
     * @param pageable pagination and sorting parameters
     * @return paginated results sorted by price
     */
    Page<InventoryItemDTO> findByNameSortedByPrice(String name, Pageable pageable);

    /**
     * Creates new inventory item with initial stock.
     * Automatically logs INITIAL_STOCK event to stock history.
     *
     * @param dto inventory item data
     * @return created item with generated ID
     * @throws IllegalArgumentException if validation fails
     */
    InventoryItemDTO save(InventoryItemDTO dto);

    /**
     * Updates existing inventory item (full update).
     * For atomic stock/price changes, use adjustQuantity or updatePrice instead.
     *
     * @param id inventory item ID
     * @param dto updated item data
     * @return updated item if found, empty otherwise
     * @throws IllegalArgumentException if validation fails
     */
    Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto);

    /**
     * Deletes inventory item and records removal reason in stock history.
     *
     * @param id inventory item ID
     * @param reason business reason for deletion (e.g., EXPIRED, DAMAGED)
     */
    void delete(String id, StockChangeReason reason);

    /**
     * Adjusts item quantity by delta and logs change to stock history.
     *
     * @param id inventory item ID
     * @param delta quantity change (positive for additions, negative for reductions)
     * @param reason business reason (e.g., SOLD, DAMAGED, MANUAL_UPDATE)
     * @return updated item with new quantity
     * @throws IllegalArgumentException if resulting quantity would be negative
     */
    InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason);

    /**
     * Updates item unit price and logs PRICE_CHANGE event to stock history.
     *
     * @param id inventory item ID
     * @param newPrice new unit price (must be > 0)
     * @return updated item with new price
     * @throws IllegalArgumentException if newPrice <= 0
     */
    InventoryItemDTO updatePrice(String id, BigDecimal newPrice);

    /**
     * Renames an inventory item (changes the item name).
     * Only ADMIN users can rename items.
     * Validates that the new name is not a duplicate for the same supplier.
     *
     * @param id inventory item ID
     * @param newName new item name (must not be empty)
     * @return updated item with new name
     * @throws IllegalArgumentException if name is empty or already exists for this supplier
     * @throws IllegalArgumentException if item not found
     */
    InventoryItemDTO renameItem(String id, String newName);

    /**
     * Counts total inventory items across all suppliers (KPI).
     *
     * @return total item count
     */
    long countItems();

}
