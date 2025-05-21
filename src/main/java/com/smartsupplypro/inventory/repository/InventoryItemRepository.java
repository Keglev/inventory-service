package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    List<InventoryItem> findByNameContainingIgnoreCase(String name);
    boolean existsBySupplierId(String supplierId);
    boolean existsByNameIgnoreCase(String name);

    @Query(value = """
        SELECT name, quantity, minimum_quantity
        FROM inventory_item
        WHERE quantity < minimum_quantity
        ORDER BY quantity ASC
        """, nativeQuery = true)
    List<Object[]> findItemsBelowMinimumStock();

}
