package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.util.UUID;

import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * The item copy shared by the
 * {@link com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl} save and delete
 * unit tests; helpers with one consumer live in that spec.
 */
final class InventoryItemServiceImplFixtures {

    private InventoryItemServiceImplFixtures() {}

    /**
     * A detached copy of an item, so a stubbed repository can return it without
     * aliasing the fixture; an item without id gets a random one.
     */
    static InventoryItem copyOf(InventoryItem src) {
        InventoryItem i = new InventoryItem();
        i.setId(src.getId() != null ? src.getId() : UUID.randomUUID().toString());
        i.setName(src.getName()); i.setQuantity(src.getQuantity());
        i.setMinimumQuantity(src.getMinimumQuantity()); i.setPrice(src.getPrice());
        i.setSupplierId(src.getSupplierId());
        i.setSku(src.getSku());
        return i;
    }
}
