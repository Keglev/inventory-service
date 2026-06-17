package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;

/**
 * Tests for {@link InventoryItemServiceImpl#save(InventoryItemDTO)}.
 * Covers happy path persistence and INITIAL_STOCK logging.
 */
@SuppressWarnings({"unused", "ThrowableResultOfMethodCallIgnored"})
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplSaveTest {
    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @SuppressWarnings("FieldMayBeFinal")
    @Spy  private InventoryItemMapper inventoryItemMapper = new InventoryItemMapper();
    @Mock private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper validationHelper;
    @Mock private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper auditHelper;
    @InjectMocks private InventoryItemServiceImpl service;

    private InventoryItemDTO baseDto;

    @BeforeEach
    void setup() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");

        baseDto = new InventoryItemDTO();
        baseDto.setName("Widget");
        baseDto.setQuantity(100);
        baseDto.setMinimumQuantity(5);
        baseDto.setPrice(new BigDecimal("10.00"));
        baseDto.setSupplierId("S1");
        baseDto.setCreatedBy("admin");

        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
    }

    @Test
    @DisplayName("save: returns saved item and logs INITIAL_STOCK via auditHelper")
    void save_shouldReturnSavedItem() {
        // Map DTO to entity for persistence
        InventoryItem toPersist = new InventoryItemMapper().toEntity(baseDto);
        // Create saved copy with generated ID from repository
        InventoryItem saved = copyOf(toPersist);
        saved.setId("item-1");
        // Mock repository to return the saved entity with ID
        when(repository.save(any(InventoryItem.class))).thenReturn(saved);

        // Execute save operation
        var result = service.save(baseDto);

        // Verify returned entity has generated ID and price from DTO
        assertEquals("item-1", result.getId());
        assertEquals(new BigDecimal("10.00"), result.getPrice());

        // Verify audit helper is called with saved entity (which internally calls stockHistoryService for INITIAL_STOCK logging)
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }

    @Test
    @DisplayName("save: validation helper throws DuplicateResourceException -> propagated by service")
    void save_duplicateName_throwsConflict() {
        doThrow(new DuplicateResourceException("An inventory item with this name and price already exists."))
            .when(validationHelper).validateForCreation(any());

        assertThrows(DuplicateResourceException.class, () -> service.save(baseDto));
    }

    /**
     * Helper method to create a deep copy of an InventoryItem.
     * Used to simulate repository behavior of copying and assigning IDs.
     * 
     * @param src Source entity to copy from
     * @return New entity with same field values and generated ID if not already set
     */
    private static InventoryItem copyOf(InventoryItem src) {
        InventoryItem i = new InventoryItem();
        i.setId(src.getId() != null ? src.getId() : UUID.randomUUID().toString());
        i.setName(src.getName());
        i.setQuantity(src.getQuantity());
        i.setMinimumQuantity(src.getMinimumQuantity());
        i.setPrice(src.getPrice());
        i.setSupplierId(src.getSupplierId());
        return i;
    }
}
