package com.smartsupplypro.inventory.service.impl.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link StockAnalyticsService} date-window defaulting and boundary validation
 * in {@code getMonthlyStockMovement} and {@code getPriceTrend}.
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unused")
class AnalyticsServiceImplWindowTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    /**
     * Date-window defaulting behavior for {@code getMonthlyStockMovement}.
     */
    @SuppressWarnings("unused")
    @Nested
    class MonthlyStockMovementWindow {

        @Test
        void should_apply_default_date_window_when_both_dates_are_null() {
            // Repository call with null supplier to verify date defaulting
            Object[] r = {"2024-02", 0L, 0L};
            when(stockHistoryRepository.getMonthlyStockMovementBySupplier(any(), any(), isNull()))
                    .thenReturn(java.util.Collections.singletonList(r));

            service.getMonthlyStockMovement(null, null, null);

            var startCap    = ArgumentCaptor.forClass(LocalDateTime.class);
            var endCap      = ArgumentCaptor.forClass(LocalDateTime.class);
            var supplierCap = ArgumentCaptor.forClass(String.class);

            verify(stockHistoryRepository).getMonthlyStockMovementBySupplier(
                    startCap.capture(), endCap.capture(), supplierCap.capture());

            LocalDateTime start = startCap.getValue();
            LocalDateTime end   = endCap.getValue();

            assertNotNull(start);
            assertNotNull(end);
            assertFalse(end.isBefore(start));
            assertNull(supplierCap.getValue());
        }

        @Test
        void should_throw_when_start_date_is_after_end_date() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getMonthlyStockMovement(
                            LocalDate.parse("2024-03-10"),
                            LocalDate.parse("2024-03-01"),
                            null));
            assertNotNull(ex.getMessage());
        }
    }

    /**
     * Item-ID validation for {@code getPriceTrend}.
     */
    @SuppressWarnings("unused")
    @Nested
    class PriceTrendItemIdValidation {

        @Test
        void should_throw_when_item_id_is_blank() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getPriceTrend("   ", null,
                            LocalDate.now().minusDays(1), LocalDate.now()));
            assertNotNull(ex.getMessage());
        }
    }
}
