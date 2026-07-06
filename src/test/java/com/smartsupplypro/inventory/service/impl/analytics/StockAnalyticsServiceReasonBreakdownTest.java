package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.ReasonBreakdownDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit test for the reason-breakdown projection mapping and window validation.
 */
@ExtendWith(MockitoExtension.class)
class StockAnalyticsServiceReasonBreakdownTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    @Test
    void mapsProjectionRows_toDTO() {
        when(stockHistoryRepository.getReasonBreakdown(any(), any(), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[] { "SOLD", BigDecimal.ZERO, BigDecimal.valueOf(7) }));

        List<ReasonBreakdownDTO> out = service.getReasonBreakdown(
                LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28), null, null);

        assertEquals(1, out.size());
        assertEquals("SOLD", out.get(0).reason());
        assertEquals(0L, out.get(0).increase());
        assertEquals(7L, out.get(0).decrease());
    }

    @Test
    void invertedWindow_throwsInvalidRequest() {
        assertThrows(InvalidRequestException.class, () ->
                service.getReasonBreakdown(LocalDate.of(2026, 3, 1), LocalDate.of(2026, 2, 1), null, null));
    }
}
