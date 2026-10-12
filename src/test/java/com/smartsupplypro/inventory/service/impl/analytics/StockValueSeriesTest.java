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
 * window, change points only (unchanged days left out, the range end always sent), no
 * points before the first movement, price-only changes, several items, and the empty case.
 */
class StockValueSeriesTest {

    private static final LocalDate START = LocalDate.of(2024, 3, 1);

    private static Object[] move(String itemId, String day, long netChange, String unitPrice) {
        return new Object[]{itemId, Date.valueOf(day), netChange, new BigDecimal(unitPrice)};
    }

    private static List<Double> values(List<StockValueOverTimeDTO> series) {
        return series.stream().map(StockValueOverTimeDTO::totalValue).toList();
    }

    private static List<LocalDate> dates(List<StockValueOverTimeDTO> series) {
        return series.stream().map(StockValueOverTimeDTO::date).toList();
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
    void should_leave_out_the_days_on_which_the_value_does_not_change() {
        List<Object[]> movements = List.of(
                move("a", "2024-03-01", 10, "2.00"),
                move("a", "2024-03-04", 5, "2.00"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START.plusDays(3));

        assertEquals(List.of(LocalDate.of(2024, 3, 1), LocalDate.of(2024, 3, 4)), dates(series));
        assertEquals(List.of(20.0, 30.0), values(series));
    }

    @Test
    void should_send_the_range_end_with_the_value_carried_to_it() {
        List<Object[]> movements = List.of(
                move("a", "2024-02-01", 10, "2.00"),
                move("a", "2024-03-02", -2, "2.00"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START.plusDays(9));

        assertEquals(List.of(START, START.plusDays(1), START.plusDays(9)), dates(series));
        assertEquals(List.of(20.0, 16.0, 16.0), values(series));
    }

    @Test
    void should_start_at_the_first_movement_instead_of_sending_zero_before_it() {
        List<Object[]> movements = List.<Object[]>of(move("a", "2024-03-04", 10, "2.00"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START.plusDays(5));

        assertEquals(List.of(LocalDate.of(2024, 3, 4), START.plusDays(5)), dates(series));
        assertEquals(List.of(20.0, 20.0), values(series));
    }

    @Test
    void should_keep_a_value_of_zero_once_the_stock_has_history() {
        List<Object[]> movements = List.of(
                move("a", "2024-02-01", 5, "2.00"),
                move("a", "2024-02-10", -5, "2.00"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START.plusDays(2));

        assertEquals(List.of(START, START.plusDays(2)), dates(series));
        assertEquals(List.of(0.0, 0.0), values(series));
    }

    @Test
    void should_send_a_single_point_when_the_range_is_one_day() {
        List<Object[]> movements = List.<Object[]>of(move("a", "2024-03-01", 10, "2.00"));

        List<StockValueOverTimeDTO> series = StockValueSeries.build(movements, START, START);

        assertEquals(List.of(START), dates(series));
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
        assertEquals(List.of(START, START.plusDays(1), START.plusDays(2)), dates(series));
    }

    @Test
    void should_return_an_empty_series_when_no_item_has_any_history() {
        assertTrue(StockValueSeries.build(List.of(), START, START.plusDays(5)).isEmpty());
    }
}
