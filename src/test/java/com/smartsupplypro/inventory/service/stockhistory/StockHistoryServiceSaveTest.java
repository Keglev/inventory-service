package com.smartsupplypro.inventory.service.stockhistory;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;

/**
 * Unit tests for {@link StockHistoryService} service-level save behavior.
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class StockHistoryServiceSaveTest extends StockHistoryServiceTestBase {

    /**
     * Verifies that {@link StockHistoryService#save(StockHistoryDTO)} validates the DTO, resolves supplierId,
     * converts reason string to enum, and persists a StockHistory entity.
     */
    @Test
    void save_shouldPersistMappedEntity_andResolveSupplierId() {
        // GIVEN
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .itemId(ITEM_1)
                .change(2)
                .reason(StockChangeReason.SOLD.name())
                .createdBy(ADMIN)
                .priceAtChange(new BigDecimal("120.00"))
                .build();

        // WHEN
        service.save(dto);

        // THEN
        StockHistory saved = captureSavedHistory();
        assertNotNull(saved.getId());
        assertTrue(saved.getId().startsWith("sh-" + ITEM_1 + "-"));
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(SUPPLIER_1, saved.getSupplierId());
        assertEquals(2, saved.getChange());
        assertEquals(StockChangeReason.SOLD, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
        assertEquals(new BigDecimal("120.00"), saved.getPriceAtChange());
    }
}
