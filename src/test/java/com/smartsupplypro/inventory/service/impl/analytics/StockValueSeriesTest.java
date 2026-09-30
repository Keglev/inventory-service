package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;

/**
 * Unit tests for {@link StockValueSeries}: the opening position from movements before the
 * window, carrying positions across days without movement, price-only changes, several
 * items, and the empty case.
 */
class StockValueSeriesTest {

    private static final LocalDate START = LocalDate.of(2024, 3, 1);

    private static Object[] move(String itemId, String day, long netChange, String unitPrice) {
        return new Object[]{itemId, Date.valueOf(day), netChange, new BigDecimal(unitPrice)};
    }

    private static List<Double> values(List<StockValueOverTimeDTO> series) {
        return series.stream().map(StockValueOverTimeDTO::totalValue).toList();
    }

    @Test
    void should_open_the_window_with_the_position_built_before_it_when_a_sale_follows() {
        // the old query started every item at zero on the first day, so this sale read -30
        List<Object[]> movements = List.of(
                move("a", "2024-01-10", 100, "3.00"),
                move("a", "2024-03-02", -10, "3.00"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START.plusDays(1));

        assertEquals(List.of(300.0, 270.0), values(series));
    }

    @Test
    void should_carry_every_position_forward_when_a_day_has_no_movement() {
        List<Object[]> movements = List.of(
                move("a", "2024-03-01", 10, "2.00"),
                move("a", "2024-03-04", 5, "2.00"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START.plusDays(3));

        assertEquals(List.of(20.0, 20.0, 20.0, 30.0), values(series));
        assertEquals(LocalDate.of(2024, 3, 2), series.get(1).date());
    }

    @Test
    void should_revalue_the_whole_position_when_only_the_price_changes() {
        List<Object[]> movements = List.of(
                move("a", "2024-03-01", 10, "2.00"),
                move("a", "2024-03-02", 0, "2.50"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START.plusDays(1));

        assertEquals(List.of(20.0, 25.0), values(series));
    }

    @Test
    void should_add_up_every_item_when_items_move_on_different_days() {
        List<Object[]> movements = List.of(
                move("a", "2024-02-20", 4, "5.00"),
                move("b", "2024-03-02", 3, "1.50"),
                move("a", "2024-03-03", -4, "5.00"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START.plusDays(2));

        assertEquals(List.of(20.0, 24.5, 4.5), values(series));
    }

    @Test
    void should_return_an_empty_series_when_no_item_has_any_history() {
        assertTrue(StockValueSeries.build(List.of(), START, START.plusDays(5)).isEmpty());
    }
}
