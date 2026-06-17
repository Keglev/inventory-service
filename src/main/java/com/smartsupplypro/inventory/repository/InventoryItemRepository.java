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
 * <p>Uses {@code @EntityGraph} on {@link #findAll()} and {@link #findByNameSortedByPrice}
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

    /**
     * Finds items below minimum stock with optional supplier filter.
     * Returns: [name, quantity, minimum_quantity], ordered by quantity ascending.
     *
     * @param supplierId optional supplier filter (null returns all suppliers)
     * @return Object arrays with low-stock item data
     */
    @Query(value = "SELECT name, quantity, minimum_quantity FROM inventory_item "
        + "WHERE quantity < minimum_quantity "
        + "AND (:supplierId IS NULL OR supplier_id = :supplierId) "
        + "ORDER BY quantity ASC", nativeQuery = true)
    List<Object[]> findItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);

    /**
     * Counts items with quantity below a fixed KPI threshold (null quantity treated as 0).
     *
     * @param threshold quantity threshold
     * @return count of items strictly below the threshold
     */
    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE COALESCE(i.quantity, 0) < :threshold")
    long countWithQuantityBelow(@Param("threshold") int threshold);

    /**
     * Finds items by partial name with supplier pre-fetched, sorted by price ascending.
     *
     * @param name     partial item name (case-insensitive)
     * @param pageable pagination parameters
     * @return paginated results with supplier association eagerly loaded
     */
    @EntityGraph(attributePaths = {"supplier"})
    @Query("SELECT i FROM InventoryItem i "
        + "WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%')) "
        + "ORDER BY i.price ASC")
    Page<InventoryItem> findByNameSortedByPrice(@Param("name") String name, Pageable pageable);
}
