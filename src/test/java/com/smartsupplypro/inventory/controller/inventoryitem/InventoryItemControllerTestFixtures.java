package com.smartsupplypro.inventory.controller.inventoryitem;

import java.math.BigDecimal;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;

/**
 * Request and response bodies shared by the inventory item controller web-slice tests.
 */
final class InventoryItemControllerTestFixtures {

    private InventoryItemControllerTestFixtures() {}

    /**
     * A valid item DTO with the given id. Each call returns a new instance, so a test
     * that needs another value sets it on its own copy.
     */
    static InventoryItemDTO sample(String id) {
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setId(id);
        dto.setName("Monitor");
        dto.setQuantity(10);
        dto.setPrice(new BigDecimal("199.99"));
        dto.setSupplierId("sup-1");
        dto.setSku("SKU-CTL-1");
        return dto;
    }
}
