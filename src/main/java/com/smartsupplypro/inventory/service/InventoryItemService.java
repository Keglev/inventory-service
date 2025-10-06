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
 * <p>
 * This service provides the business layer contract for CRUD operations on inventory items,
 * including stock quantity adjustments, price updates, and search functionality.
 * All operations automatically maintain audit trails via stock history logging.
 * </p>
 *
 * <p><b>Key Responsibilities:</b></p>
 * <ul>
 *   <li>Expose create/read/update/delete operations to controllers</li>
 *   <li>Enforce domain rules (e.g., minimum stock thresholds, price validation)</li>
 *   <li>Orchestrate stock history logging for all quantity and price changes</li>
 *   <li>Keep persistence details encapsulated in the implementation layer</li>
 *   <li>Provide search and pagination capabilities for large datasets</li>
 * </ul>
 *
 * <p><b>Audit Trail:</b> All quantity adjustments and price changes are automatically
 * recorded in the stock history table with the user who made the change, timestamp,
 * reason code, and the price at the time of change.</p>
 *
 * @see StockHistoryService
 * @see com.smartsupplypro.inventory.enums.StockChangeReason
 * @author SmartSupply
 */
public interface InventoryItemService {

    /**
     * Retrieves all inventory items without pagination.
     * <p>
     * <b>Warning:</b> This method loads all items into memory. For large datasets,
     * use {@link #findByNameSortedByPrice(String, Pageable)} instead to avoid
     * performance issues.
     * </p>
     *
     * @return list of all {@link InventoryItemDTO} in the system
     */
    List<InventoryItemDTO> getAll();

    /**
     * Retrieves a single inventory item by its unique identifier.
     *
     * @param id the unique inventory item ID
     * @return {@link Optional} containing the item if found, empty otherwise
     */
    Optional<InventoryItemDTO> getById(String id);

    /**
     * Searches for inventory items by partial name match with pagination support.
     * <p>
     * Results are automatically sorted by price in ascending order to help identify
     * the most cost-effective options during procurement decisions.
     * </p>
     *
     * <p><b>Search Behavior:</b> Case-insensitive, supports wildcards, matches anywhere in the name.</p>
     *
     * @param name the search term (partial name match)
     * @param pageable pagination and additional sorting parameters
     * @return paginated {@link Page} of {@link InventoryItemDTO} sorted by price ascending
     */
    Page<InventoryItemDTO> findByNameSortedByPrice(String name, Pageable pageable);

    /**
     * Creates a new inventory item with initial stock.
     * <p>
     * <b>Business Rules:</b>
     * <ul>
     *   <li>Item name must be unique within the same supplier</li>
     *   <li>Initial quantity must be >= 0</li>
     *   <li>Price must be > 0</li>
     *   <li>Minimum quantity threshold must be >= 0</li>
     *   <li>Supplier must exist in the system</li>
     * </ul>
     * </p>
     *
     * <p>A stock history entry with {@code INITIAL_STOCK} reason is automatically created
     * to record the item's creation and initial quantity.</p>
     *
     * @param dto the inventory item data transfer object
     * @return the created {@link InventoryItemDTO} with generated ID
     * @throws IllegalArgumentException if validation rules are violated
     */
    InventoryItemDTO save(InventoryItemDTO dto);

    /**
     * Updates an existing inventory item with new values.
     * <p>
     * <b>Important:</b> This is a full update operation. All fields in the DTO will
     * replace the existing item's values. Use {@link #adjustQuantity(String, int, StockChangeReason)}
     * or {@link #updatePrice(String, BigDecimal)} for atomic quantity/price changes with
     * proper audit trails.
     * </p>
     *
     * @param id the unique inventory item ID to update
     * @param dto the updated inventory item data
     * @return {@link Optional} containing the updated item if found, empty otherwise
     * @throws IllegalArgumentException if validation rules are violated
     */
    Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto);

    /**
     * Deletes an inventory item and records the business reason for removal.
     * <p>
     * <b>Audit Trail:</b> A stock history entry is created with:
     * <ul>
     *   <li>Quantity change = -(current quantity) to zero out the item</li>
     *   <li>Reason code = provided reason (e.g., EXPIRED, DAMAGED, SCRAPPED)</li>
     *   <li>Price at change = current unit price</li>
     * </ul>
     * </p>
     *
     * <p><b>Warning:</b> This is a hard delete. Consider using {@code adjustQuantity}
     * with reason codes instead if you need to preserve the item for historical reporting.</p>
     *
     * @param id the unique inventory item ID to delete
     * @param reason the business reason for deletion (required for audit compliance)
     */
    void delete(String id, StockChangeReason reason);

    /**
     * Adjusts the quantity of an inventory item by a delta value and logs the change.
     * <p>
     * <b>Usage Examples:</b>
     * <ul>
     *   <li>Receiving new stock: {@code adjustQuantity(id, +100, INITIAL_STOCK)}</li>
     *   <li>Selling items: {@code adjustQuantity(id, -5, SOLD)}</li>
     *   <li>Recording damage: {@code adjustQuantity(id, -10, DAMAGED)}</li>
     *   <li>Manual correction: {@code adjustQuantity(id, -2, MANUAL_UPDATE)}</li>
     * </ul>
     * </p>
     *
     * <p><b>Audit Trail:</b> A stock history entry is automatically created with:
     * <ul>
     *   <li>Quantity change = delta value</li>
     *   <li>Reason code = provided reason</li>
     *   <li>Price at change = current unit price (for COGS calculation)</li>
     *   <li>User = authenticated user from security context</li>
     * </ul>
     * </p>
     *
     * @param id the unique inventory item ID
     * @param delta the quantity change (positive for additions, negative for reductions)
     * @param reason the business reason for the adjustment (required)
     * @return the updated {@link InventoryItemDTO} with new quantity
     * @throws IllegalArgumentException if resulting quantity would be negative
     */
    InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason);

    /**
     * Updates the unit price of an inventory item and logs a price change event.
     * <p>
     * <b>Business Logic:</b> Price changes are recorded in stock history with:
     * <ul>
     *   <li>Quantity change = 0 (no stock movement)</li>
     *   <li>Reason code = PRICE_CHANGE</li>
     *   <li>Price at change = new unit price</li>
     * </ul>
     * This enables price trend analysis and historical cost tracking for financial reporting.
     * </p>
     *
     * <p><b>Note:</b> This method only updates the current price. It does NOT recalculate
     * Weighted Average Cost (WAC). WAC is updated automatically during purchase operations.</p>
     *
     * @param id the unique inventory item ID
     * @param newPrice the new unit price (must be > 0)
     * @return the updated {@link InventoryItemDTO} with new price
     * @throws IllegalArgumentException if newPrice <= 0
     */
    InventoryItemDTO updatePrice(String id, BigDecimal newPrice);

    /**
     * Counts the total number of inventory items in the system.
     * <p>
     * This is a Key Performance Indicator (KPI) used for dashboard metrics and
     * inventory management reporting.
     * </p>
     *
     * @return total count of inventory items across all suppliers
     */
    long countItems();

}
