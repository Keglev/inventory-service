package com.smartsupplypro.inventory.service.impl.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link StockAnalyticsService} input validation —
 * blank/null supplier IDs, invalid date ranges, and malformed filter objects.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplValidationTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    /**
     * Supplier-scoped query validation.
     */
    @Nested
    class SupplierIdValidation {

        @Test
        void should_throw_when_supplier_id_is_blank_for_item_update_frequency() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getItemUpdateFrequency(" "));
            assertNotNull(ex.getMessage());
        }

        @Test
        void should_throw_when_supplier_id_is_blank_for_low_stock_query() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getItemsBelowMinimumStock("  "));
            assertNotNull(ex.getMessage());
        }
    }

    /**
     * Filter object validation for {@code getFilteredStockUpdates}.
     */
    @Nested
    class FilteredStockUpdatesValidation {

        @Test
        void should_throw_when_filter_is_null() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getFilteredStockUpdates(null));
            assertNotNull(ex.getMessage());
        }

        @Test
        void should_throw_when_date_range_is_inverted() {
            StockUpdateFilterDTO f = new StockUpdateFilterDTO();
            f.setStartDate(LocalDateTime.of(2024, 2, 10, 0, 0));
            f.setEndDate(LocalDateTime.of(2024, 2, 1, 0, 0));

            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getFilteredStockUpdates(f));
            assertNotNull(ex.getMessage());
        }

        @Test
        void should_throw_when_min_change_exceeds_max_change() {
            StockUpdateFilterDTO f = new StockUpdateFilterDTO();
            f.setStartDate(LocalDateTime.of(2024, 2, 1, 0, 0));
            f.setEndDate(LocalDateTime.of(2024, 2, 2, 0, 0));
            f.setMinChange(10);
            f.setMaxChange(5);

            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getFilteredStockUpdates(f));
            assertNotNull(ex.getMessage());
        }
    }

    /**
     * Parameter validation for {@code getPriceTrend}.
     */
    @Nested
    class PriceTrendValidation {

        @Test
        void should_throw_when_date_range_is_inverted() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getPriceTrend("I1", "S1",
                            LocalDate.parse("2024-02-10"), LocalDate.parse("2024-02-01")));
            assertNotNull(ex.getMessage());
        }

        @Test
        void should_throw_when_item_id_is_blank() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getPriceTrend("  ", null,
                            LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-02")));
            assertNotNull(ex.getMessage());
        }
    }
}
