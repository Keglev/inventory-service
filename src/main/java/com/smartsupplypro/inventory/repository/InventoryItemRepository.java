package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    List<InventoryItem> findByNameContainingIgnoreCase(String name);
    boolean existsBySupplierId(String supplierId);
    boolean existsByNameIgnoreCase(String name);

    @Query(value = """
        SELECT name, quantity, minimum_quantity
        FROM inventory_item
        WHERE quantity < minimum_quantity
            AND (:supplierId IS NULL OR supplier_id = :supplierId)
        ORDER BY quantity ASC
        """, nativeQuery = true)
    List<Object[]> findItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);

}
