package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository interface for managing {@link InventoryItem} entities.
 *
 * <p>Provides CRUD operations and custom query methods for searching
 * inventory by name, validating supplier relationships, and checking
 * stock thresholds.
 */
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {

    /**
     * Finds inventory items that partially match the given name, case-insensitive.
     *
     * @param name Partial or full item name
     * @return List of matching inventory items
     */
    List<InventoryItem> findByNameContainingIgnoreCase(String name);

    /**
     * Checks whether any inventory items are associated with the given supplier.
     *
     * @param supplierId ID of the supplier
     * @return {@code true} if at least one item exists for the supplier
     */
    boolean existsBySupplierId(String supplierId);

    /**
     * Checks whether an inventory item with the given name already exists (case-insensitive).
     *
     * @param name Name of the item
     * @return {@code true} if such item exists
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Finds all inventory items where quantity is below the defined minimum quantity,
     * optionally filtered by supplier ID.
     *
     * <p>This native SQL query is optimized for analytics and dashboard features.
     *
     * @param supplierId Optional supplier ID to filter results
     * @return List of Object arrays: [name, quantity, minimum_quantity]
     */
    @Query(value = """
        SELECT name, quantity, minimum_quantity
        FROM inventory_item
        WHERE quantity < minimum_quantity
            AND (:supplierId IS NULL OR supplier_id = :supplierId)
        ORDER BY quantity ASC
        """, nativeQuery = true)
    List<Object[]> findItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);
}

