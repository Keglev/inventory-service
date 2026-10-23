package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.UUID;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;

/**
 * Items, DTOs and the service under test shared by the
 * {@link InventoryItemServiceImpl} save, update and delete unit tests.
 */
final class InventoryItemServiceImplFixtures {

    private InventoryItemServiceImplFixtures() {}

    /**
     * The service with the real validation helper over the given mocked repositories,
     * so a test sees the exception types and messages production throws (NF-21).
     */
    static InventoryItemServiceImpl newServiceWithRealValidation(InventoryItemRepository repository,
            SupplierRepository supplierRepository, InventoryItemAuditHelper auditHelper) {
        InventoryItemValidationHelper validationHelper =
                new InventoryItemValidationHelper(repository, supplierRepository);
        return new InventoryItemServiceImpl(repository, validationHelper, auditHelper, new InventoryItemMapper());
    }

    /** A valid create or update request for supplier S1. */
    static InventoryItemDTO newBaseDto() {
        InventoryItemDTO baseDto = new InventoryItemDTO();
        baseDto.setName("Widget");
        baseDto.setQuantity(100);
        baseDto.setMinimumQuantity(5);
        baseDto.setPrice(new BigDecimal("10.00"));
        baseDto.setSupplierId("S1");
        baseDto.setCreatedBy("admin");
        baseDto.setSku("SKU-SVC-1");
        return baseDto;
    }

    /** The stored item item-1 that {@link #newBaseDto()} describes. */
    static InventoryItem newExistingItem() {
        InventoryItem existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setQuantity(100);
        existing.setMinimumQuantity(5);
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("S1");
        existing.setSku("SKU-SVC-1");
        return existing;
    }

    /** A detached copy of a request, without id, so a test can change it freely. */
    static InventoryItemDTO copyOf(InventoryItemDTO src) {
        InventoryItemDTO d = new InventoryItemDTO();
        d.setName(src.getName()); d.setQuantity(src.getQuantity());
        d.setMinimumQuantity(src.getMinimumQuantity()); d.setPrice(src.getPrice());
        d.setSupplierId(src.getSupplierId()); d.setCreatedBy(src.getCreatedBy());
        d.setSku(src.getSku());
        return d;
    }

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
