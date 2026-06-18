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
 * Unit tests for {@link com.smartsupplypro.inventory.service.StockHistoryService}
 * item deletion audit logging behavior.
 */
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StockHistoryServiceDeleteTest extends StockHistoryServiceTestBase {

    @Test
    void should_record_negative_change_with_deletion_reason_when_item_deleted() {
        service.delete(ITEM_1, StockChangeReason.RETURNED_TO_SUPPLIER, ADMIN);

        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(-1, saved.getChange());
        assertEquals(StockChangeReason.RETURNED_TO_SUPPLIER, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }
}
