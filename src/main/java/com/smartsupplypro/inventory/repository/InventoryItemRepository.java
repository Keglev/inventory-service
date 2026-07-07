package com.smartsupplypro.inventory.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Repository for {@link InventoryItem} persistence operations.
 *
 * <p>Uses {@code @EntityGraph} on {@link #findAll()} and {@link #searchActiveItems}
 * to prevent N+1 queries on supplier joins. Native SQL is used for below-minimum stock
 * queries where optional supplier filtering is required.</p>
 *
 * @see InventoryItem
 * @see InventoryItemService
 */
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {

    /** Fetches all items with supplier eagerly loaded to prevent N+1 queries. */
    @Override
    @EntityGraph(attributePaths = {"supplier"})
    @NonNull
    List<InventoryItem> findAll();

    /** Fetches all ACTIVE items (soft-deleted items excluded) with supplier eagerly loaded. */
    @EntityGraph(attributePaths = {"supplier"})
    List<InventoryItem> findByActiveTrue();

    /** Counts ACTIVE items (soft-deleted items excluded). */
    long countByActiveTrue();

    /**
     * Checks whether any item linked to the supplier has quantity above {@code minQty}.
     * Used to block supplier deletion when active stock remains.
     *
     * @param supplierId supplier ID
     * @param minQty     quantity threshold (pass 0 to check for any stock)
     * @return true if any linked item has quantity above the threshold
     */
    @Query("select (count(i) > 0) from InventoryItem i left join i.supplier s "
        + "where (s.id = :supplierId or i.supplierId = :supplierId) and i.quantity > :minQty")
    boolean existsActiveStockForSupplier(@Param("supplierId") String supplierId,
                                         @Param("minQty") int minQty);

    List<InventoryItem> findByNameIgnoreCase(String name);

    List<InventoryItem> findBySkuIgnoreCase(String sku);

    /**
     * Finds items below minimum stock with optional supplier filter.
     * Returns: [name, quantity, minimum_quantity], ordered by quantity ascending.
     *
     * @param supplierId optional supplier filter (null returns all suppliers)
     * @return Object arrays with low-stock item data
     */
    @Query("SELECT i.name, i.quantity, i.minimumQuantity FROM InventoryItem i "
        + "WHERE i.quantity < i.minimumQuantity "
        + "AND i.active = true "
        + "AND (:supplierId IS NULL OR i.supplierId = :supplierId) "
        + "ORDER BY i.quantity ASC")
    List<Object[]> findItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);

    /**
     * Counts items with quantity below a fixed KPI threshold (null quantity treated as 0).
     *
     * @param threshold quantity threshold
     * @return count of items strictly below the threshold
     */
    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.active = true AND COALESCE(i.quantity, 0) < :threshold")
    long countWithQuantityBelow(@Param("threshold") int threshold);

    /**
     * Searches ACTIVE items by partial name or SKU (case-insensitive), with optional
     * supplier and below-minimum-stock filters. Supplier is pre-fetched to prevent
     * N+1 queries. Ordering comes exclusively from the {@link Pageable} sort.
     *
     * @param name             partial item name or SKU; empty string matches all items
     * @param supplierId       optional supplier filter (null returns all suppliers)
     * @param belowMinimumOnly when true, only items with quantity below minimumQuantity
     * @param pageable         pagination and sorting parameters
     * @return paginated results with supplier association eagerly loaded
     */
    @EntityGraph(attributePaths = {"supplier"})
    @Query("SELECT i FROM InventoryItem i "
        + "WHERE i.active = true "
        + "AND (LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%')) "
        + "OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :name, '%'))) "
        + "AND (:supplierId IS NULL OR i.supplierId = :supplierId) "
        + "AND (:belowMinimumOnly = false OR i.quantity < i.minimumQuantity)")
    Page<InventoryItem> searchActiveItems(@Param("name") String name,
                                          @Param("supplierId") String supplierId,
                                          @Param("belowMinimumOnly") boolean belowMinimumOnly,
                                          Pageable pageable);
}
