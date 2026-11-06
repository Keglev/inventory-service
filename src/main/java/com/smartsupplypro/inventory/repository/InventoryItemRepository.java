package com.smartsupplypro.inventory.repository;

import java.util.List;
import java.util.Optional;

import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Repository for {@link InventoryItem} persistence operations.
 *
 * <p>Uses {@code @EntityGraph} on {@link #findAll()} and {@link #searchActiveItems}
 * to prevent N+1 queries on supplier joins.</p>
 *
 * @see InventoryItem
 * @see com.smartsupplypro.inventory.service.InventoryItemService
 */
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {

    /** Fetches all items with supplier eagerly loaded to prevent N+1 queries. */
    @Override
    @EntityGraph(attributePaths = {"supplier"})
    @NonNull
    List<InventoryItem> findAll();

    /**
     * Fetches one item with supplier eagerly loaded.
     *
     * <p>Without this override the inherited method leaves {@code supplier} as a
     * lazy proxy. {@code InventoryItemServiceImpl.getById} is not transactional
     * and its mapper reads {@code supplier.getName()}; with
     * {@code spring.jpa.open-in-view} off, no session would be left to resolve the
     * proxy, and resolving it would cost a second query per call.</p>
     */
    @Override
    @EntityGraph(attributePaths = {"supplier"})
    @NonNull
    Optional<InventoryItem> findById(@NonNull String id);

    /** Counts ACTIVE items (soft-deleted items excluded). */
    long countByActiveTrue();

    /**
     * Checks whether any item references the supplier, deleted (inactive) items included.
     * Supplier deletion uses it: a deleted item keeps its supplier and its stock history.
     *
     * @param supplierId supplier ID
     * @return true if at least one item, active or not, references the supplier
     */
    boolean existsBySupplierId(String supplierId);

    /**
     * Finds items by exact name, ignoring case. The duplicate checks on create
     * (same name and price) and on rename use it.
     *
     * @param name item name
     * @return matching items, from any supplier
     */
    List<InventoryItem> findByNameIgnoreCase(String name);

    /**
     * Finds items by SKU, ignoring case; the SKU check on create uses it.
     *
     * @param sku stock keeping unit
     * @return matching items
     */
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
     * Counts active items whose quantity is below their own minimum quantity: the
     * rows {@link #findItemsBelowMinimumStockFiltered} returns for all suppliers.
     *
     * @return number of active items below their minimum stock
     */
    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.quantity < i.minimumQuantity AND i.active = true")
    long countItemsBelowMinimumStock();

    /**
     * Searches ACTIVE items by partial name or SKU (case-insensitive), with optional
     * supplier and below-minimum-stock filters. Supplier is pre-fetched to prevent
     * N+1 queries. Ordering comes exclusively from the {@link Pageable} sort.
     *
     * <p>The explicit {@code ESCAPE '\'} is deliberate. Without it Hibernate's H2
     * dialect appends {@code ESCAPE ''}, and H2 in Oracle mode treats {@code ''}
     * as NULL, so every LIKE matches nothing. Oracle accepts the same clause.</p>
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
        + "AND (LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%')) ESCAPE '\\' "
        + "OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :name, '%')) ESCAPE '\\') "
        + "AND (:supplierId IS NULL OR i.supplierId = :supplierId) "
        + "AND (:belowMinimumOnly = false OR i.quantity < i.minimumQuantity)")
    Page<InventoryItem> searchActiveItems(@Param("name") String name,
                                          @Param("supplierId") String supplierId,
                                          @Param("belowMinimumOnly") boolean belowMinimumOnly,
                                          Pageable pageable);
}
