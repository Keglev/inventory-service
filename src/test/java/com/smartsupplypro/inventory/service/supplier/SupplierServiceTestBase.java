package com.smartsupplypro.inventory.service.supplier;

import org.junit.jupiter.api.BeforeEach;
import static org.mockito.Mockito.mock;

import com.smartsupplypro.inventory.mapper.SupplierMapper;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.SupplierService;
import com.smartsupplypro.inventory.service.impl.SupplierServiceImpl;

/**
 * Shared fixture for {@link SupplierServiceImpl} unit tests.
 */
abstract class SupplierServiceTestBase {

    protected SupplierRepository supplierRepository;
    protected InventoryItemRepository inventoryItemRepository;
    protected SupplierMapper supplierMapper;
    protected SupplierService supplierService;

    @BeforeEach
    void setUpBase() {
        supplierRepository = mock(SupplierRepository.class);
        inventoryItemRepository = mock(InventoryItemRepository.class);
        supplierMapper = new SupplierMapper();
        supplierService = new SupplierServiceImpl(supplierRepository, inventoryItemRepository, supplierMapper);
    }
}
