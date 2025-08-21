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
 * Repository interface for managing {@link InventoryItem} entities.
 *
 * <h2>Design & Conventions</h2>
 * <ul>
 *   <li><b>Derived queries that involve the supplier</b> use the JPA relation field
 *       <code>supplier</code> (singular). Use the Spring Data convention <code>Supplier_Id</code>
 *       to target the relation's ID (e.g., <code>existsBySupplier_Id(...)</code>).</li>
 *   <li><b>Native SQL</b> may reference the raw FK column <code>supplier_id</code> directly for
 *       performance or simplicity (e.g., analytics dashboards). This avoids a join when you only
 *       need the FK value.</li>
 *   <li><b>Do not use plural <code>Suppliers</code> in method names</b>. The entity field is
 *       <code>supplier</code> (singular), and Spring Data parses method names against entity fields.</li>
 * </ul>
 */
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {

    /**
    * Checks whether there exists at least one inventory item linked to the given supplier
    * (either via the scalar FK {@code supplierId} or the {@code supplier} relation) that has
    * a quantity greater than the provided threshold.
    *
    * <p>This method is used before deleting a supplier to enforce the business rule:
    * suppliers cannot be deleted while they still have stock assigned to any items.</p>
    *
    * @param supplierId the supplier identifier (matches either i.supplierId or i.supplier.id)
    * @param minQty     the minimum quantity threshold (usually 0)
    * @return true if at least one linked item exists with quantity > minQty, false otherwise
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
     * Finds inventory items that partially match the given name, case-insensitive.
     *
     * @param name Partial or full item name
     * @return List of matching inventory items
     */
    List<InventoryItem> findByNameContainingIgnoreCase(String name);

    /**
     * Checks whether any inventory items are associated with the given supplier.
     *
     * <p><b>Relation-based:</b> uses the {@code @ManyToOne} field <code>supplier</code>.
     * The suffix {@code _Id} targets the relation's ID property.</p>
     *
     * @param supplierId ID of the supplier
     * @return {@code true} if at least one item exists for the supplier
     */
    boolean existsBySupplier_Id(String supplierId);

    /**
     * Checks if any item exists with the same name and price (duplicate-by-value check).
     */
    boolean existsByNameAndPrice(String name, BigDecimal price);

    /**
     * Finds all inventory items where quantity is below the defined minimum quantity,
     * optionally filtered by supplier ID.
     *
     * <p><b>Native SQL (FK-based):</b> uses the raw column <code>supplier_id</code> for filtering.
     * Returns rows as <code>[name, quantity, minimum_quantity]</code>.</p>
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
     * <p>Used to verify potential duplicates with identical names but different prices.</p>
     *
     * @param name the exact name of the item (case-insensitive)
     * @return list of inventory items with that name
     */
    List<InventoryItem> findByNameIgnoreCase(String name);

    /**
     * JPQL search by name with a deterministic sort by price ascending.
     */
    @Query("""
        SELECT i FROM InventoryItem i
        WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%'))
        ORDER BY i.price ASC
    """)
    Page<InventoryItem> findByNameSortedByPrice(@Param("name") String name, Pageable pageable);

    /**
     * Finds inventory items by name with pagination (case-insensitive).
     */
    Page<InventoryItem> findByNameContainingIgnoreCase(String name, Pageable pageable);

    /**
     * Checks whether any item exists with the given (case-insensitive) name.
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Checks whether any items for a supplier have quantity strictly greater than the given threshold.
     *
     * <p><b>Relation-based:</b> uses the singular relation field <code>supplier</code> and targets
     * its ID with <code>_Id</code>. This fixes the previous parse error caused by the plural
     * method name <code>existsBySuppliers_IdAndQuantityGreaterThan</code>.</p>
     *
     * @param supplierId supplier ID (relation ID)
     * @param quantity threshold (strictly greater than)
     * @return {@code true} if any matching items exist
     */
    boolean existsBySupplier_IdAndQuantityGreaterThan(String supplierId, int quantity);
}
