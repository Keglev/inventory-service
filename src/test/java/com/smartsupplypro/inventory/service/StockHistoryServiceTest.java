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
     */
    @BeforeEach
    void setUp() {
        // Default stubs used by most tests:
        when(itemRepository.findById("item-1"))
                 .thenReturn(Optional.of(mkItem("item-1", "S1")));
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
     */
    @Test
    void testLogStockChange_withValidReason_shouldSaveStockHistory() {
        service.logStockChange("item-1", 10, StockChangeReason.SOLD, "admin");

        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

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
     */
    @Test
    void testLogStockChange_withNegativeChange_shouldSaveNormally() {
        service.logStockChange("item-1", -5, StockChangeReason.SCRAPPED, "admin");

        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

        StockHistory saved = captor.getValue();
        assertEquals("item-1", saved.getItemId());
        assertEquals(-5, saved.getChange());
        assertEquals(StockChangeReason.SCRAPPED, saved.getReason());
        assertEquals("admin", saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

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

        // ensure nothing was saved:
        verifyNoInteractions(repository); // <-- fixed variable name
    }

    /**
     * Verifies that a zero stock change (no quantity movement) is rejected.
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
    */
    @Test
    void testDelete_shouldRecordDeletionInStockHistory() {
        service.delete("item-1", StockChangeReason.RETURNED_TO_SUPPLIER, "admin");

        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

        StockHistory saved = captor.getValue();
        assertEquals("item-1", saved.getItemId());
        assertEquals(-1, saved.getChange()); // default for deletions
        assertEquals(StockChangeReason.RETURNED_TO_SUPPLIER, saved.getReason());
        assertEquals("admin", saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }
}
