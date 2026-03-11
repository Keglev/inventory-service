package com.smartsupplypro.inventory.service.supplier;

import org.junit.jupiter.api.BeforeEach;
import static org.mockito.Mockito.mock;

import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.SupplierService;
import com.smartsupplypro.inventory.service.impl.SupplierServiceImpl;

/**
 * Shared fixture for SupplierService unit tests.
 *
 * <p><strong>Intent</strong>: keep individual test classes small and readable while exercising the
 * same production implementation ({@link SupplierServiceImpl}).</p>
 */
@SuppressWarnings("unused")
abstract class SupplierServiceTestBase {

    protected SupplierRepository supplierRepository;
    protected InventoryItemRepository inventoryItemRepository;
    protected SupplierService supplierService;

    @BeforeEach
    void setUpBase() {
        supplierRepository = mock(SupplierRepository.class);
        inventoryItemRepository = mock(InventoryItemRepository.class);
        supplierService = new SupplierServiceImpl(supplierRepository, inventoryItemRepository);
    }
}
