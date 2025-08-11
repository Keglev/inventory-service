package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    boolean existsBySupplier_Id(String supplierId);

    boolean existsByNameAndPrice(String name, BigDecimal price);

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

    /**
    * Finds all inventory items with an exact name match (case-insensitive).
    *
       * <p>Used to verify potential duplicates with identical names but different prices.
    *
    * @param name the exact name of the item (case-insensitive)
    * @return list of inventory items with that name
    */
    List<InventoryItem> findByNameIgnoreCase(String name);

    @Query("""
        SELECT i FROM InventoryItem i
        WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%'))
        ORDER BY i.price ASC
    """)
    Page<InventoryItem> findByNameSortedByPrice(@Param("name") String name, Pageable pageable);

    /**
     * Finds inventory items by name with pagination.
     * 
     */
    Page<InventoryItem> findByNameContainingIgnoreCase(String name, Pageable pageable);

    boolean existsByNameIgnoreCase(String name);


}

