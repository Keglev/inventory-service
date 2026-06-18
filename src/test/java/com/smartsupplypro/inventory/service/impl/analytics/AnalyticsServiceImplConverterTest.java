package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link StockAnalyticsService} converter helpers invoked via
 * {@code getFilteredStockUpdates} Ã¢â‚¬â€ verifying numeric and date type coercion.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplConverterTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    private static Object[] row(Object ts, String item, String supplier,
                                Object qty, String reason, String createdBy) {
        return new Object[]{item, supplier, qty, reason, createdBy, ts};
    }

    private static LocalDateTime at(int y, int m, int d, int H, int M) {
        return LocalDateTime.of(y, m, d, H, M);
    }

    /**
     * Tests for numeric type coercion in {@code getFilteredStockUpdates}.
     */
    @Nested
    class NumericTypeCoercion {

        @Test
        void should_map_integer_long_and_big_decimal_change_values_to_long() {
            var ts = Timestamp.valueOf(at(2024, 2, 1, 10, 0));
            List<Object[]> rows = List.of(
                    row(ts, "A", "S", 3,                    "SOLD", "u1"),
                    row(ts, "B", "S", 4L,                   "SOLD", "u2"),
                    row(ts, "C", "S", new BigDecimal("5"),  "SOLD", "u3")
            );
            when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(rows);

            var out = service.getFilteredStockUpdates(new StockUpdateFilterDTO());

            assertEquals(3, out.size());
            assertEquals(3, out.get(0).change());
            assertEquals(4, out.get(1).change());
            assertEquals(5, out.get(2).change());
        }

        @Test
        void should_throw_illegal_state_when_change_value_is_non_numeric_string() {
            var ts = Timestamp.valueOf(at(2024, 2, 1, 10, 0));
            when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(Collections.singletonList(row(ts, "A", "S", "not-a-number", "SOLD", "u")));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.getFilteredStockUpdates(new StockUpdateFilterDTO()));
            assertNotNull(ex.getMessage());
        }
    }

    /**
     * Tests for date type coercion in {@code getFilteredStockUpdates}.
     */
    @Nested
    class DateTypeCoercion {

        @Test
        void should_accept_timestamp_and_local_date_time_for_created_at_field() {
            var ts1 = Timestamp.valueOf(at(2024, 2, 1, 11, 0));
            var ts2 = Timestamp.valueOf(at(2024, 2, 2,  0, 0));
            var ldt = at(2024, 2, 3, 12, 0);
            List<Object[]> rows = List.of(
                    row(ts1, "A", "S", 1, "SOLD", "u1"),
                    row(ts2, "B", "S", 1, "SOLD", "u1"),
                    row(ldt, "C", "S", 1, "SOLD", "u1")
            );
            when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(rows);

            var out = service.getFilteredStockUpdates(new StockUpdateFilterDTO());

            assertEquals(3, out.size());
        }
    }
}
