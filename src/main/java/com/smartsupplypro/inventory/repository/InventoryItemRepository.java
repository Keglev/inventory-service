package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    List<InventoryItem> findByNameContainingIgnoreCase(String name);
    boolean existsBySupplierId(String supplierId);

}
