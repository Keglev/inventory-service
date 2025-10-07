package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Repository for inventory item management with analytics queries.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>Search</strong>: Name-based lookup with case-insensitive matching</li>
 *   <li><strong>Stock Analysis</strong>: Below-minimum queries, quantity thresholds</li>
 *   <li><strong>Supplier Validation</strong>: Active stock checks before deletion</li>
 *   <li><strong>Duplicate Detection</strong>: Name + price uniqueness validation</li>
 *   <li><strong>Native SQL</strong>: Performance-optimized queries for analytics</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong>:
 * <ul>
 *   <li>Relation field is <code>supplier</code> (singular) - use <code>Supplier_Id</code> convention</li>
 *   <li>Native SQL uses <code>supplier_id</code> FK column directly for performance</li>
 *   <li>JPQL queries use entity field names (e.g., <code>i.supplierId</code>)</li>
 * </ul>
 *
 * @see InventoryItem
 * @see InventoryItemService
 * @see <a href="file:../../../../../../docs/architecture/patterns/repository-patterns.md">Repository Patterns</a>
 */
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {

    /**
     * Checks if supplier has active stock before deletion (uses supplier relation or FK).
     *
     * @param supplierId supplier ID
     * @param minQty minimum quantity threshold
     * @return true if any linked item has quantity > minQty
     */
    @Query("""
        select (count(i) > 0)
        from InventoryItem i
        left join i.supplier s
        where (s.id = :supplierId or i.supplierId = :supplierId)
            and i.quantity > :minQty
    """)
    boolean existsActiveStockForSupplier(@Param("supplierId") String supplierId,
                                         @Param("minQty") int minQty);


    /**
     * Finds items by partial name match (case-insensitive).
     *
     * @param name partial or full item name
     * @return matching inventory items
     */
    List<InventoryItem> findByNameContainingIgnoreCase(String name);

    /**
     * Checks if any items exist for supplier (uses supplier relation).
     *
     * @param supplierId supplier ID
     * @return true if at least one item exists
     */
    boolean existsBySupplier_Id(String supplierId);

    /**
     * Checks if item exists with exact name and price (duplicate detection).
     *
     * @param name item name
     * @param price item price
     * @return true if duplicate exists
     */
    boolean existsByNameAndPrice(String name, BigDecimal price);

    /**
     * Finds items below minimum stock threshold with optional supplier filter.
     * Returns: [name, quantity, minimum_quantity]
     *
     * @param supplierId optional supplier filter
     * @return Object arrays with low-stock item data
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
     * Counts items below minimum stock threshold with optional supplier filter.
     *
     * @param supplierId optional supplier filter
     * @return count of low-stock items
     */
    @Query(value = """
        SELECT COUNT(*)
        FROM inventory_item
        WHERE quantity < minimum_quantity
            AND (:supplierId IS NULL OR supplier_id = :supplierId)
        """, nativeQuery = true)
    long countItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);

    /**
     * Counts items below fixed KPI threshold (treats null quantity as 0).
     *
     * @param threshold quantity threshold
     * @return count of items below threshold
     */
    @Query("""
        SELECT COUNT(i)
        FROM InventoryItem i
        WHERE COALESCE(i.quantity, 0) < :threshold
        """)
    long countWithQuantityBelow(@Param("threshold") int threshold);

    /**
     * Finds items by exact name (case-insensitive) for duplicate verification.
     *
     * @param name item name
     * @return matching inventory items
     */
    List<InventoryItem> findByNameIgnoreCase(String name);

    /**
     * Searches items by name with deterministic price sorting.
     *
     * @param name search term
     * @param pageable pagination parameters
     * @return paginated results sorted by price ascending
     */
    @Query("""
        SELECT i FROM InventoryItem i
        WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%'))
        ORDER BY i.price ASC
    """)
    Page<InventoryItem> findByNameSortedByPrice(@Param("name") String name, Pageable pageable);

    /**
     * Finds items by name with pagination (case-insensitive).
     *
     * @param name search term
     * @param pageable pagination parameters
     * @return paginated results
     */
    Page<InventoryItem> findByNameContainingIgnoreCase(String name, Pageable pageable);

    /**
     * Checks if item exists by name (case-insensitive).
     *
     * @param name item name
     * @return true if exists
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Checks if supplier has items with quantity above threshold (uses supplier relation).
     *
     * @param supplierId supplier ID
     * @param quantity threshold (strictly greater than)
     * @return true if matching items exist
     */
    boolean existsBySupplier_IdAndQuantityGreaterThan(String supplierId, int quantity);
}
