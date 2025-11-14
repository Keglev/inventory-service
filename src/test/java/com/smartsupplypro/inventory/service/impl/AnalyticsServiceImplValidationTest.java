package com.smartsupplypro.inventory.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Validation tests for {@link StockAnalyticsService}.
 * Tests input validation and error handling for analytics operations.
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unused")
class AnalyticsServiceImplValidationTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    @Test
    void getItemUpdateFrequency_blankSupplier_throws() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getItemUpdateFrequency(" "));
        assertNotNull(ex.getMessage());
    }

    @Test
    void getItemsBelowMinimumStock_blankSupplier_throws() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getItemsBelowMinimumStock("  "));
        assertNotNull(ex.getMessage());
    }

    @Test
    void getFilteredStockUpdates_rejectsInvalidRange() {
        StockUpdateFilterDTO f = new StockUpdateFilterDTO();
        f.setStartDate(LocalDateTime.of(2024, 2, 10, 0, 0));
        f.setEndDate(LocalDateTime.of(2024, 2, 1, 0, 0));

        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(f));
        assertNotNull(ex.getMessage());
    }

    @Test
    void getFilteredStockUpdates_rejectsMinGreaterThanMax() {
        StockUpdateFilterDTO f = new StockUpdateFilterDTO();
        f.setStartDate(LocalDateTime.of(2024, 2, 1, 0, 0));
        f.setEndDate(LocalDateTime.of(2024, 2, 2, 0, 0));
        f.setMinChange(10);
        f.setMaxChange(5);

        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(f));
        assertNotNull(ex.getMessage());
    }

    @Test
    void getFilteredStockUpdates_nullFilter_throwsInvalidRequest() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(null));
        assertNotNull(ex.getMessage());
    }

    @Test
    void getPriceTrend_invalidRange_throws() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class,
                () -> service.getPriceTrend("I1", "S1",
                        LocalDate.parse("2024-02-10"),
                        LocalDate.parse("2024-02-01")));
        assertNotNull(ex.getMessage());
    }

    @Test
    void getPriceTrend_blankItem_throws() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class,
                () -> service.getPriceTrend("  ", null,
                        LocalDate.parse("2024-02-01"),
                        LocalDate.parse("2024-02-02")));
        assertNotNull(ex.getMessage());
    }
}
