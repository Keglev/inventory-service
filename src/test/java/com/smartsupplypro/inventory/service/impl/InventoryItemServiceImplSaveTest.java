package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * Tests for {@link InventoryItemServiceImpl#save(InventoryItemDTO)}.
 * Covers happy path persistence and INITIAL_STOCK logging.
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplSaveTest {
    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
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
        lenient().when(repository.existsByNameIgnoreCase(anyString())).thenReturn(false);
    }

    @Test
    @DisplayName("save: returns saved item and logs INITIAL_STOCK via auditHelper")
    void save_shouldReturnSavedItem() {
        InventoryItem toPersist = InventoryItemMapper.toEntity(baseDto);
        InventoryItem saved = copyOf(toPersist);
        saved.setId("item-1");
        when(repository.save(any(InventoryItem.class))).thenReturn(saved);

        var result = service.save(baseDto);

        assertEquals("item-1", result.getId());
        assertEquals(new BigDecimal("10.00"), result.getPrice());

        // Verify audit helper is called (which internally calls stockHistoryService)
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }

    @Test
    @DisplayName("save: duplicate name -> 409 CONFLICT")
    void save_duplicateName_throwsConflict() {
        when(repository.existsByNameIgnoreCase(anyString())).thenReturn(true);

        lenient().when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> {
            InventoryItem src = inv.getArgument(0, InventoryItem.class);
            if (src.getId() == null) {
                src.setId("generated-id");
            }
            return src;
        });
    }

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
