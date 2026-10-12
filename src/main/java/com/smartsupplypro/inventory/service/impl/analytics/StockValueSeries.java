package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;

import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.asLocalDate;
import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.asNumber;

/**
 * Builds the stock value series by replaying per-item daily movements.
 *
 * <p>An item's quantity on a day is the sum of all its logged changes since its
 * INITIAL_STOCK entry, and its unit price is the price of its latest event, so replaying
 * the movements from the beginning of history gives every day's closing position, valued
 * as the sum over items of quantity times last known unit price.</p>
 *
 * <p>The series holds change points, not one point per calendar day: the first day with
 * history, every day whose closing value differs from the previous point, and the last
 * day of the range. A value holds until the next point, so the chart draws the same step
 * line from far fewer points (2477 daily points became 160 for six years of demo data).
 * Days before the first movement are left out instead of being sent as 0.</p>
 */
final class StockValueSeries {

    private StockValueSeries() {}

    /**
     * Replays the movements and emits the change points of the closing value from start
     * to end.
     *
     * @param movements rows of [item_id, day, net_change, unit_price], ordered by day and
     *                  starting at the beginning of history, not at {@code start}
     * @param start     first day of the range (inclusive)
     * @param end       last day of the range (inclusive), always the last point
     * @return the first day with history, each day the value changes, and end; or an
     *         empty list when no item has any history up to end
     */
    static List<StockValueOverTimeDTO> build(List<Object[]> movements, LocalDate start, LocalDate end) {
        if (movements.isEmpty()) {
            return List.of();
        }
        Map<String, Long> quantities = new HashMap<>();
        Map<String, BigDecimal> prices = new HashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        List<StockValueOverTimeDTO> series = new ArrayList<>();
        BigDecimal lastSent = null;
        int next = 0;
        for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
            while (next < movements.size() && !asLocalDate(movements.get(next)[1]).isAfter(day)) {
                total = total.add(apply(movements.get(next), quantities, prices));
                next++;
            }
            // next > 0: some movement on or before this day, so the day has history.
            boolean changed = lastSent == null || total.compareTo(lastSent) != 0;
            if (next > 0 && (changed || day.equals(end))) {
                series.add(new StockValueOverTimeDTO(day, total.doubleValue()));
                lastSent = total;
            }
        }
        return series;
    }

    // Moves one item to its new position and returns the change in the total, so a day
    // costs one update per moved item instead of a sum over every item.
    private static BigDecimal apply(Object[] row, Map<String, Long> quantities, Map<String, BigDecimal> prices) {
        String itemId = (String) row[0];
        long oldQuantity = quantities.getOrDefault(itemId, 0L);
        BigDecimal oldPrice = prices.getOrDefault(itemId, BigDecimal.ZERO);
        long newQuantity = oldQuantity + asNumber(row[2]).longValue();
        BigDecimal newPrice = new BigDecimal(asNumber(row[3]).toString());
        quantities.put(itemId, newQuantity);
        prices.put(itemId, newPrice);
        return newPrice.multiply(BigDecimal.valueOf(newQuantity))
                .subtract(oldPrice.multiply(BigDecimal.valueOf(oldQuantity)));
    }
}
