package com.smartsupplypro.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import org.mockito.MockitoAnnotations;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link StockHistoryService}, validating its ability to correctly
 * log stock changes under various input conditions. Ensures persistence behavior
 * and input validation rules for audit logs.
 */
@ActiveProfiles("test")
public class StockHistoryServiceTest {

    @Mock
    private StockHistoryRepository repository;

    @InjectMocks
    private StockHistoryService stockHistoryService;

    /**
     * Initializes mock objects before each test case.
     */
    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    /**
     * Tests that a valid stock change log with proper reason, quantity, and metadata
     * is persisted via the repository and all fields are mapped correctly.
     */
    @Test
    void testLogStockChange_withValidReason_shouldSaveStockHistory() {
        stockHistoryService.logStockChange("item-1", 10, StockChangeReason.SOLD, "admin");

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
            stockHistoryService.logStockChange("item-1", 5, null, "admin");
        });

        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
    }

    /**
     * Ensures that negative quantity changes (e.g., stock reductions)
     * are allowed and persisted correctly.
     */
    @Test
    void testLogStockChange_withNegativeChange_shouldSaveNormally() {
        stockHistoryService.logStockChange("item-1", -5, StockChangeReason.SCRAPPED, "admin");

        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

        StockHistory saved = captor.getValue();
        assertEquals("item-1", saved.getItemId());
        assertEquals(-5, saved.getChange());
        assertEquals(StockChangeReason.SCRAPPED, saved.getReason());
        assertEquals("admin", saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    /**
     * Verifies that the service throws an exception when the createdBy field is blank or empty.
     */
    @Test
    void testLogStockChange_withBlankCreatedBy_shouldThrow() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            stockHistoryService.logStockChange("item-1", 5, StockChangeReason.SOLD, " ")
        );

        assertEquals("CreatedBy is required", ex.getMessage());
    }

    /**
     * Verifies that a zero stock change (no quantity movement) is rejected
     * as meaningless and results in an {@link IllegalArgumentException}.
     */
    @Test
    void testLogStockChange_withZeroChange_shouldThrow() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            stockHistoryService.logStockChange("item-1", 0, StockChangeReason.SOLD, "admin")
        );

        assertEquals("Change amount must be non-zero", ex.getMessage());
    }

    /**
     * Ensures that a blank item ID input is treated as invalid and results in an exception.
     */
    @Test
    void testLogStockChange_withNullItemId_shouldThrow() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            stockHistoryService.logStockChange(" ", 5, StockChangeReason.SOLD, "admin")
        );

        assertEquals("Item ID cannot be null or empty", ex.getMessage());
    }

    /**
     * Verifies that a null createdBy field (missing user context) results in a validation error.
     */
    @Test
    void testLogStockChange_withNullCreatedBy_shouldThrow() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            stockHistoryService.logStockChange("item-1", 5, StockChangeReason.SOLD, null)
        );
        assertEquals("CreatedBy is required", ex.getMessage());
    }

    /**
    * Verifies that the `delete` method correctly logs a negative change
    * and persists it via the repository.
    */
    @Test
    void testDelete_shouldRecordDeletionInStockHistory() {
        stockHistoryService.delete("item-1", StockChangeReason.RETURNED_TO_SUPPLIER, "admin");

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
