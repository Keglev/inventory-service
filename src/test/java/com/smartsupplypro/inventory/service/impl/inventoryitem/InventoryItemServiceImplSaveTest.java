package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.security.core.context.SecurityContextHolder;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;

/**
 * Unit tests for {@link InventoryItemServiceImpl#save(InventoryItemDTO)}
 * covering happy-path persistence, audit logging, and validation rejection.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplSaveTest {

    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @Mock private InventoryItemValidationHelper validationHelper;
    @Mock private InventoryItemAuditHelper auditHelper;
    @SuppressWarnings("FieldMayBeFinal")
    @Spy  private InventoryItemMapper inventoryItemMapper = new InventoryItemMapper();
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
        baseDto.setSku("SKU-SVC-1");

        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void should_return_saved_item_and_log_initial_stock_via_audit_helper() {
        InventoryItem toPersist = new InventoryItemMapper().toEntity(baseDto);
        InventoryItem saved = copyOf(toPersist);
        saved.setId("item-1");
        when(repository.save(any(InventoryItem.class))).thenReturn(saved);

        InventoryItemDTO result = service.save(baseDto);

        assertEquals("item-1", result.getId());
        assertEquals(new BigDecimal("10.00"), result.getPrice());
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }

    @Test
    void should_succeed_when_item_quantity_is_zero() {
        baseDto.setQuantity(0);
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemDTO result = service.save(baseDto);

        assertNotNull(result);
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }

    @Test
    void should_throw_duplicate_exception_when_item_with_same_name_and_price_exists() {
        doThrow(new DuplicateResourceException("An inventory item with this name and price already exists."))
                .when(validationHelper).validateForCreation(any());

        assertThrows(DuplicateResourceException.class, () -> service.save(baseDto));
    }

    @Test
    void should_throw_when_validation_rejects_null_name() {
        baseDto.setName(null);
        doThrow(new IllegalArgumentException("Product name cannot be null or empty"))
                .when(validationHelper).validateForCreation(any());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.save(baseDto));
        assertEquals("Product name cannot be null or empty", ex.getMessage());
    }

    @Test
    void should_throw_when_validation_rejects_negative_quantity() {
        baseDto.setQuantity(-5);
        doThrow(new IllegalArgumentException("Quantity cannot be negative"))
                .when(validationHelper).validateForCreation(any());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.save(baseDto));
        assertEquals("Quantity cannot be negative", ex.getMessage());
    }

    @Test
    void should_throw_when_validation_rejects_non_positive_price() {
        baseDto.setPrice(new BigDecimal("-10.00"));
        doThrow(new IllegalArgumentException("Price must be positive or greater than zero"))
                .when(validationHelper).validateForCreation(any());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.save(baseDto));
        assertEquals("Price must be positive or greater than zero", ex.getMessage());
    }

    @Test
    void should_throw_when_validation_rejects_missing_supplier_id() {
        baseDto.setSupplierId(null);
        doThrow(new IllegalArgumentException("Supplier ID must be provided"))
                .when(validationHelper).validateForCreation(any());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.save(baseDto));
        assertEquals("Supplier ID must be provided", ex.getMessage());
    }

    @Test
    void should_throw_when_supplier_does_not_exist() {
        doThrow(new IllegalArgumentException("Supplier does not exist"))
                .when(validationHelper).validateForCreation(any());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.save(baseDto));
        assertEquals("Supplier does not exist", ex.getMessage());
    }

    private static InventoryItem copyOf(InventoryItem src) {
        InventoryItem i = new InventoryItem();
        i.setId(src.getId());
        i.setName(src.getName());
        i.setQuantity(src.getQuantity());
        i.setMinimumQuantity(src.getMinimumQuantity());
        i.setPrice(src.getPrice());
        i.setSupplierId(src.getSupplierId());
        i.setSku(src.getSku());
        return i;
    }
}
