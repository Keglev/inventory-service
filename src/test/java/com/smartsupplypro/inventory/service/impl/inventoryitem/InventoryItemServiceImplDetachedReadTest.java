package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * Regression test for {@link com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl#getById(String)}
 * read with no surrounding transaction.
 *
 * <p>{@code InventoryItem.supplier} is a lazy {@code @ManyToOne} and
 * {@code InventoryItemMapper} reads {@code supplier.getName()}. The service read
 * methods are not transactional, so this call resolves the association outside
 * any persistence context. It passes only because the repository fetches the
 * supplier with the query.</p>
 *
 * <p>Deliberately NOT {@code @DataJpaTest}: that wraps each test in a
 * transaction, which keeps a session open and hides exactly the failure this
 * test exists to catch. The rest of the suite cannot see it either -
 * {@code @WebMvcTest} mocks the service away.</p>
 *
 * <p>Runs against its own in-memory database. The test profile points every
 * context at one named H2 instance with {@code ddl-auto: create-drop}, so a
 * context shutting down elsewhere in the suite drops the schema and this test
 * fails with an empty database when run alongside the others.</p>
 */
@SpringBootTest(properties =
        "spring.datasource.url=jdbc:h2:mem:detachedread;MODE=Oracle;DATABASE_TO_UPPER=true;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
@ActiveProfiles("test")
class InventoryItemServiceImplDetachedReadTest {

    private static final String SUPPLIER_ID = "detached-read-supplier";
    private static final String ITEM_ID = "detached-read-item";

    @Autowired
    private InventoryItemService service;

    @Autowired
    private InventoryItemRepository itemRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @BeforeEach
    void seed() {
        Supplier supplier = new Supplier();
        supplier.setId(SUPPLIER_ID);
        supplier.setName("Detached Read Supplier");
        supplier.setCreatedBy("test");
        supplierRepository.save(supplier);

        InventoryItem item = new InventoryItem();
        item.setId(ITEM_ID);
        item.setSku("SKU-DETACHED-READ");
        item.setName("Detached Read Item");
        item.setPrice(new BigDecimal("1.00"));
        item.setQuantity(1);
        item.setMinimumQuantity(0);
        item.setSupplierId(SUPPLIER_ID);
        item.setCreatedBy("test");
        item.setActive(true);
        itemRepository.save(item);
    }

    @Test
    void getById_withoutAnOpenSession_resolvesTheSupplierName() {
        Optional<InventoryItemDTO> found = service.getById(ITEM_ID);

        assertTrue(found.isPresent(), "seeded item should be returned");
        assertEquals("Detached Read Supplier", found.get().getSupplierName(),
                "supplier name must be resolved by the query, not by a lazy proxy");
    }
}
