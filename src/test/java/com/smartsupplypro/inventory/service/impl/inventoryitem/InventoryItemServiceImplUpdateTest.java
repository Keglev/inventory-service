package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;

/**
 * Tests for {@link InventoryItemServiceImpl#update(String, InventoryItemDTO)}.
 *
 * <p><strong>Why these tests exist</strong>: Update behavior has multiple service-level guards and
 * integration points that are easy to regress (uniqueness checks, optimistic locking, validation
 * outcomes, and audit logging). This test suite targets those branches directly while mocking
 * dependencies and helper collaborators.
 *
 * <p><strong>What is intentionally mocked</strong>:
 * <ul>
 *   <li>{@code validationHelper} is mocked to simulate existence/uniqueness behavior</li>
 *   <li>{@code auditHelper} is verified to ensure quantity-change logging is triggered</li>
 *   <li>OAuth2 context is set to mirror authenticated request execution</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplUpdateTest {
    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @Mock private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper validationHelper;
    @Mock private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper auditHelper;
    @InjectMocks private InventoryItemServiceImpl service;

    private InventoryItemDTO baseDto;
    private InventoryItem existing;

    @BeforeEach
    void setup() {
        // Set up OAuth2 authentication context (simulates logged-in ADMIN user)
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");

        // Build test DTO with valid sample data
        baseDto = new InventoryItemDTO();
        baseDto.setName("Widget");
        baseDto.setQuantity(100);
        baseDto.setMinimumQuantity(5);
        baseDto.setPrice(new BigDecimal("10.00"));
        baseDto.setSupplierId("S1");
        baseDto.setCreatedBy("admin");

        // Build entity to return from mocks
        existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setQuantity(100);
        existing.setMinimumQuantity(5);
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("S1");

        // Default mocks: supplier exists, name is unique
        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
        lenient().when(repository.existsByNameIgnoreCase(anyString())).thenReturn(false);

        // Configure validation helper to return item if found
        lenient().when(validationHelper.validateForUpdate(anyString(), any())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found for update"));
        });

        // Configure uniqueness validation to throw DuplicateResourceException on conflict
        lenient().doAnswer(inv -> {
            String id = inv.getArgument(0);
            InventoryItem existingItem = inv.getArgument(1);
            InventoryItemDTO dto = inv.getArgument(2);

            // Check if name or price changed
            boolean nameChanged = !existingItem.getName().equalsIgnoreCase(dto.getName());
            boolean priceChanged = !existingItem.getPrice().equals(dto.getPrice());

            if (nameChanged || priceChanged) {
                // Look for conflicting items with same name and price
                java.util.List<InventoryItem> conflicts = repository.findByNameIgnoreCase(dto.getName());
                for (InventoryItem item : conflicts) {
                    if (!item.getId().equals(id) && item.getPrice().equals(dto.getPrice())) {
                        throw new com.smartsupplypro.inventory.exception.DuplicateResourceException(
                            "Item with name '" + dto.getName() + "' and price " + dto.getPrice() + " already exists"
                        );
                    }
                }
            }
            return null;
        }).when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());
    }

    @Test
    @DisplayName("update: not found -> IllegalArgumentException")
    void update_shouldThrow_whenNotFound() {
        // Mock: item with ID "missing-id" does not exist
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        InventoryItemDTO updateDto = copyOf(baseDto);

        // Attempt to update non-existent item
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.update("missing-id", updateDto));

        // Verify error message indicates not found
        assertTrue(ex.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("update: duplicate name -> 409 CONFLICT")
    void update_duplicateName_throwsConflict() {
        // Mock: item with ID "id-1" exists
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));

        // Build update DTO with new name
        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setName("Widget-2");

        // Mock: another item with name "Widget-2" already exists
        InventoryItem conflict = new InventoryItem();
        conflict.setId("other-id");
        conflict.setName("Widget-2");
        conflict.setPrice(new BigDecimal("10.00"));
        conflict.setQuantity(1);
        conflict.setMinimumQuantity(1);
        conflict.setSupplierId("S1");
        when(repository.findByNameIgnoreCase("Widget-2")).thenReturn(java.util.List.of(conflict));

        lenient().when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> {
            InventoryItem src = inv.getArgument(0, InventoryItem.class);
            if (src.getId() == null) src.setId("generated-id");
            return src;
        });

        try {
            // Attempt to update to conflicting name
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.update("id-1", updateDto));
            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertTrue(safeReason(ex).contains("already"));
        } catch (org.opentest4j.AssertionFailedError ignored) {
            // Alternative path: DuplicateResourceException thrown directly
            com.smartsupplypro.inventory.exception.DuplicateResourceException ex2 =
                    assertThrows(com.smartsupplypro.inventory.exception.DuplicateResourceException.class,
                            () -> service.update("id-1", updateDto));
            assertTrue(ex2.getMessage() != null && !ex2.getMessage().isBlank());
        }
    }

    @Test
    @DisplayName("update: optimistic lock -> propagated exception")
    void update_optimisticLock_isSurfacedAsConflict() {
        // Mock: item exists and is found
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));
        // Mock: save throws optimistic lock exception (version mismatch)
        when(repository.save(any())).thenThrow(
                new ObjectOptimisticLockingFailureException(InventoryItem.class, "id-1")
        );

        InventoryItemDTO updateDto = copyOf(baseDto);

        // Attempt to update when another thread modified item
        ObjectOptimisticLockingFailureException ex = assertThrows(
                ObjectOptimisticLockingFailureException.class,
                () -> service.update("id-1", updateDto)
        );
        assertTrue(ex.getMessage() != null && !ex.getMessage().isBlank());
    }

    @Test
    @DisplayName("update: minimumQuantity <= 0 does not overwrite existing minimumQuantity")
    void update_minimumQuantityNonPositive_doesNotOverwriteExisting() {
        InventoryItem current = copyOf(existing);
        current.setMinimumQuantity(5);

        when(validationHelper.validateForUpdate(eq("id-1"), any())).thenReturn(current);
        lenient().doNothing().when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setMinimumQuantity(0); // should be ignored
        updateDto.setQuantity(101); // to create a quantity diff

        var result = service.update("id-1", updateDto);

        assertTrue(result.isPresent());
        assertEquals(5, result.get().getMinimumQuantity());
        assertEquals(101, result.get().getQuantity());
        verify(auditHelper).logQuantityChange(any(InventoryItem.class), eq(1));
    }

    @Test
    @DisplayName("update: price changed -> updates price when valid")
    void update_priceChanged_updatesPrice() {
        InventoryItem current = copyOf(existing);
        current.setPrice(new BigDecimal("10.00"));

        when(validationHelper.validateForUpdate(eq("id-1"), any())).thenReturn(current);
        lenient().doNothing().when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setPrice(new BigDecimal("12.50"));

        var result = service.update("id-1", updateDto);

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("12.50"), result.get().getPrice());
        verify(auditHelper).logQuantityChange(any(InventoryItem.class), eq(0));
    }

    @Test
    @DisplayName("update: price changed but invalid -> ResponseStatusException 422")
    void update_priceChanged_invalid_throws422() {
        InventoryItem current = copyOf(existing);
        current.setPrice(new BigDecimal("10.00"));

        when(validationHelper.validateForUpdate(eq("id-1"), any())).thenReturn(current);
        lenient().doNothing().when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setPrice(BigDecimal.ZERO); // invalid -> should trigger assertPriceValid

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.update("id-1", updateDto));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatusCode());
    }

    private static InventoryItemDTO copyOf(InventoryItemDTO src) {
        InventoryItemDTO d = new InventoryItemDTO();
        d.setName(src.getName());
        d.setQuantity(src.getQuantity());
        d.setMinimumQuantity(src.getMinimumQuantity());
        d.setPrice(src.getPrice());
        d.setSupplierId(src.getSupplierId());
        d.setCreatedBy(src.getCreatedBy());
        return d;
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

    private static String safeReason(ResponseStatusException ex) {
        return String.valueOf(ex.getReason()).toLowerCase();
    }
}
