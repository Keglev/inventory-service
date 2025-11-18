package com.smartsupplypro.inventory.service;
import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link StockHistoryService}, validating its ability to correctly
 * log stock changes under various input conditions. Ensures persistence behavior
 * and input validation rules for audit logs.
 *
 * <p><strong>Operation Coverage:</strong></p>
 * <ul>
 *   <li><b>logStockChange:</b> Persist stock audit entries with multi-field validation</li>
 *   <li><b>delete:</b> Record negative change for item deletion with audit trail</li>
 * </ul>
 *
 * <p><strong>Validation Rules:</strong></p>
 * <ul>
 *   <li>Item ID: required and non-null</li>
 *   <li>Quantity change: non-zero (positive or negative allowed, but not 0)</li>
 *   <li>Reason: required and valid enum (SOLD, SCRAPPED, RETURNED_TO_SUPPLIER, etc.)</li>
 *   <li>CreatedBy: required, non-null, and non-blank</li>
 * </ul>
 *
 * <p><strong>Design Notes:</strong></p>
 * <ul>
 *   <li>Negative quantities are allowed (e.g., sales, returns, damage).</li>
 *   <li>Positive quantities are allowed (e.g., restock, returns from customer).</li>
 *   <li>Both positive and negative help track full history in a single entity.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class StockHistoryServiceTest {

    @Mock
    private StockHistoryRepository repository;

    @Mock
    private InventoryItemRepository itemRepository;

    @InjectMocks
    private StockHistoryService service;

    /**
     * Initializes mock objects before each test case.
     * Sets up default mock behavior for common inventory items.
     */
    @BeforeEach
    void setUp() {
        // Default stubs used by most tests:
        // Mock item-1 linked to supplier S1
        when(itemRepository.findById("item-1"))
                 .thenReturn(Optional.of(mkItem("item-1", "S1")));
        // Mock new-id linked to supplier S2
        when(itemRepository.findById("new-id"))
                 .thenReturn(Optional.of(mkItem("new-id", "S2")));
    }

    private static com.smartsupplypro.inventory.model.InventoryItem mkItem(String id, String supplierId) {
        var it = new com.smartsupplypro.inventory.model.InventoryItem();
        it.setId(id);
        it.setSupplierId(supplierId);
        return it;
    }

    /**
     * Tests that a valid stock change log with proper reason, quantity, and metadata
     * is persisted via the repository and all fields are mapped correctly.
     * Scenario: Positive quantity with valid reason.
     * Expected: StockHistory entity saved with all fields set correctly.
     */
    @Test
    void testLogStockChange_withValidReason_shouldSaveStockHistory() {
        service.logStockChange("item-1", 10, StockChangeReason.SOLD, "admin");

        // Capture the argument passed to save
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

        // Verify all fields were persisted correctly
        StockHistory saved = captor.getValue();
        assertEquals("item-1", saved.getItemId());
        assertEquals(10, saved.getChange());
        assertEquals(StockChangeReason.SOLD, saved.getReason());
        assertEquals("admin", saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    /**
     * Validates that an {@link IllegalArgumentException} is thrown
     * when attempting to log stock change with a null reason.
     * Scenario: Reason is null (missing enum value).
     * Expected: {@link IllegalArgumentException} exception and no save operation.
     */
    @Test
    void testLogStockChange_withInvalidReason_shouldThrowException() {
        Exception ex = assertThrows(IllegalArgumentException.class, () -> {
            service.logStockChange("item-1", 5, null, "admin");
        });
        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
    }

    /**
     * Ensures that negative quantity changes (e.g., stock reductions)
     * are allowed and persisted correctly.
     * Scenario: Negative quantity representing item disposal.
     * Expected: StockHistory saved with negative change value.
     */
    @Test
    void testLogStockChange_withNegativeChange_shouldSaveNormally() {
        service.logStockChange("item-1", -5, StockChangeReason.SCRAPPED, "admin");

        // Capture the saved entity
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

        // Verify negative quantity is preserved
        StockHistory saved = captor.getValue();
        assertEquals("item-1", saved.getItemId());
        assertEquals(-5, saved.getChange());
        assertEquals(StockChangeReason.SCRAPPED, saved.getReason());
        assertEquals("admin", saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    /**
     * Validates that blank createdBy value is rejected.
     * Scenario: CreatedBy is whitespace-only string.
     * Expected: {@link InvalidRequestException} and no save operation.
     */
    @Test
    void testLogStockChange_withBlankCreatedBy_shouldThrow() {
        var ex = assertThrows(InvalidRequestException.class, () ->
            service.logStockChange(
                "item-1",
                5,
                StockChangeReason.MANUAL_UPDATE,
                "  ",
                new BigDecimal("120.00"))
        );
        assertTrue(ex.getMessage().toLowerCase().contains("createdby"));

        // Ensure nothing was saved (transaction rolled back)
        verifyNoInteractions(repository);
    }

    /**
     * Verifies that a zero stock change (no quantity movement) is rejected.
     * Scenario: Change quantity is 0 (no actual movement).
     * Expected: {@link InvalidRequestException} since 0 is meaningless in audit log.
     */
    @Test
    void testLogStockChange_withZeroChange_shouldThrow() {
        var ex = assertThrows(InvalidRequestException.class, () ->
            service.logStockChange(
                "item-1",
                0,
                StockChangeReason.MANUAL_UPDATE,
                "admin",
                new BigDecimal("120.00"))
        );
        assertTrue(ex.getMessage().toLowerCase().contains("zero"));
    }

    /**
     * Ensures that a blank item ID input is treated as invalid and results in an exception.
     * Scenario: Item ID is null (missing required field).
     * Expected: {@link InvalidRequestException}.
     */
    @Test
    void testLogStockChange_withNullItemId_shouldThrow() {
        var ex = assertThrows(InvalidRequestException.class, () ->
            service.logStockChange(
                null,
                10,
                StockChangeReason.MANUAL_UPDATE,
                "admin",
                new BigDecimal("120.00"))
        );
        assertTrue(ex.getMessage().toLowerCase().contains("item id"));
    }

    /**
     * Verifies that a null createdBy field (missing user context) results in a validation error.
     * Scenario: CreatedBy is null (no audit user provided).
     * Expected: {@link InvalidRequestException} and no save.
     */
    @Test
    void testLogStockChange_withNullCreatedBy_shouldThrow() {
        var ex = assertThrows(InvalidRequestException.class, () ->
            service.logStockChange("item-1", 5, StockChangeReason.SOLD, null)
        );
        assertTrue(ex.getMessage().toLowerCase().contains("createdby"));
    }

    /**
    * Verifies that the `delete` method correctly logs a negative change
    * and persists it via the repository.
    * Scenario: Deleting an item (logs -1 quantity for deletion reason).
    * Expected: StockHistory saved with negative change and deletion reason.
    */
    @Test
    void testDelete_shouldRecordDeletionInStockHistory() {
        service.delete("item-1", StockChangeReason.RETURNED_TO_SUPPLIER, "admin");

        // Capture the saved entity
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

        // Verify deletion was logged as negative change with specified reason
        StockHistory saved = captor.getValue();
        assertEquals("item-1", saved.getItemId());
        assertEquals(-1, saved.getChange()); // default for deletions
        assertEquals(StockChangeReason.RETURNED_TO_SUPPLIER, saved.getReason());
        assertEquals("admin", saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }
}
