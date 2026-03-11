package com.smartsupplypro.inventory.service.stockhistory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;

/**
 * Unit tests for {@link StockHistoryService} delete audit behavior.
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class StockHistoryServiceDeleteTest extends StockHistoryServiceTestBase {

    /**
     * Verifies that {@link StockHistoryService#delete(String, StockChangeReason, String)}
     * logs a negative change and persists it via the repository.
     * Scenario: Deleting an item (logs -1 quantity for deletion reason).
     * Expected: StockHistory saved with negative change and deletion reason.
     */
    @Test
    void delete_shouldRecordDeletionInStockHistory() {
        // GIVEN/WHEN
        service.delete(ITEM_1, StockChangeReason.RETURNED_TO_SUPPLIER, ADMIN);

        // THEN
        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(-1, saved.getChange());
        assertEquals(StockChangeReason.RETURNED_TO_SUPPLIER, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }
}
