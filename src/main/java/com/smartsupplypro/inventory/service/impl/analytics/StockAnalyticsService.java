package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.ReasonBreakdownDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

import lombok.RequiredArgsConstructor;

import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.*;

/**
 * Stock analytics service for inventory metrics and reporting.
 *
 * <p>All operations are read-only. Date windows default to the last 30 days
 * when not specified. Type coercion from native SQL projections is handled
 * by {@link AnalyticsConverterHelper} to bridge H2 (test) and Oracle (prod) differences.</p>
 *
 * @see AnalyticsConverterHelper
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockAnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /**
     * Retrieves the closing inventory value (quantity * last known unit price) over a
     * date range as change points: the first day with history, each day the value
     * changes, and the range end (see {@link StockValueSeries}).
     * Defaults to last 30 days when bounds are null.
     *
     * @param startDate inclusive start date (nullable)
     * @param endDate   inclusive end date (nullable)
     * @param supplierId optional supplier filter (null/blank = all suppliers)
     * @return change points of the stock value ordered by date ascending
     * @throws InvalidRequestException if {@code startDate > endDate}
     */
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate,
                                                                   LocalDate endDate,
                                                                   String supplierId) {
        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        // History up to the window end, not from its start: the first day's value needs
        // every earlier movement. endOfDay matches the TIMESTAMP column precision.
        List<Object[]> movements = stockHistoryRepository.getDailyItemMovements(
                endOfDay(window[1]), blankToNull(supplierId));
        return StockValueSeries.build(movements, window[0], window[1]);
    }

    /**
     * Retrieves current stock quantity and value grouped by supplier, over active items.
     * @return suppliers with totals, ordered by value descending, then supplier name
     */
    public List<StockPerSupplierDTO> getTotalStockPerSupplier() {
        List<Object[]> rows = stockHistoryRepository.getTotalStockBySupplier();

        return rows.stream()
                .map(r -> new StockPerSupplierDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue(),
                        new BigDecimal(asNumber(r[2]).toString())
                ))
                .toList();
    }

    /**
     * Retrieves stock update frequency per item for a supplier.
     * Higher count indicates a more actively managed product.
     *
     * @param supplierId supplier identifier (required)
     * @return items with update counts ordered by count descending
     * @throws InvalidRequestException if {@code supplierId} is blank
     */
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId) {
        String sid = requireNonBlank(supplierId, "supplierId");
        List<Object[]> rows = stockHistoryRepository.getUpdateCountByItem(sid);

        return rows.stream()
                .map(r -> new ItemUpdateFrequencyDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue()
                ))
                .toList();
    }

    /**
     * Identifies items below minimum stock threshold for a supplier.
     * Low stock is defined as {@code currentQuantity < minimumQuantity}.
     *
     * @param supplierId supplier identifier (required)
     * @return low-stock items ordered by quantity ascending (most critical first)
     * @throws InvalidRequestException if {@code supplierId} is blank
     */
    public List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId) {
        String sid = requireNonBlank(supplierId, "supplierId");
        List<Object[]> rows = inventoryItemRepository.findItemsBelowMinimumStockFiltered(sid);

        return rows.stream().map(StockAnalyticsService::toLowStockItem).toList();
    }

    /**
     * Identifies items below minimum stock across all suppliers.
     * Low stock is defined as {@code currentQuantity < minimumQuantity}.
     *
     * <p>Unfiltered counterpart to {@link #getItemsBelowMinimumStock(String)},
     * used by the dashboard summary when no supplier filter is applied. The
     * underlying query treats a {@code null} supplier as "all suppliers".</p>
     *
     * @return low-stock items ordered by quantity ascending (most critical first)
     */
    public List<LowStockItemDTO> getItemsBelowMinimumStock() {
        List<Object[]> rows = inventoryItemRepository.findItemsBelowMinimumStockFiltered(null);

        return rows.stream().map(StockAnalyticsService::toLowStockItem).toList();
    }

    /**
     * Aggregates stock movements into monthly buckets (stock-in vs stock-out).
     * Defaults to last 30 days when bounds are null.
     *
     * @param startDate  inclusive start date (nullable)
     * @param endDate    inclusive end date (nullable)
     * @param supplierId optional supplier filter (null/blank = all suppliers)
     * @return monthly movements in YYYY-MM format ordered by month ascending
     * @throws InvalidRequestException if {@code startDate > endDate}
     */
    public List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate,
                                                                  LocalDate endDate,
                                                                  String supplierId) {
        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        // startOfDay/endOfDay so the inclusive bounds match TIMESTAMP column precision
        LocalDateTime from = startOfDay(window[0]);
        LocalDateTime to   = endOfDay(window[1]);

        List<Object[]> rows = stockHistoryRepository.getMonthlyStockMovementBySupplier(from, to, blankToNull(supplierId));

        return rows.stream()
                .map(r -> new MonthlyStockMovementDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue(),
                        asNumber(r[2]).longValue()
                ))
                .toList();
    }

    /**
     * Aggregates stock movement per reason (sign-split) inside a time window.
     * Defaults to the last 30 days when bounds are null.
     *
     * @param startDate  inclusive start date (nullable)
     * @param endDate    inclusive end date (nullable)
     * @param supplierId optional supplier filter (null/blank = all suppliers)
     * @param itemName   optional partial item name (null/blank = all items)
     * @return per-reason increase/decrease totals ordered by reason ascending
     * @throws InvalidRequestException if {@code startDate > endDate}
     */
    public List<ReasonBreakdownDTO> getReasonBreakdown(LocalDate startDate,
                                                       LocalDate endDate,
                                                       String supplierId,
                                                       String itemName) {
        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        // startOfDay/endOfDay so the inclusive bounds match TIMESTAMP column precision
        LocalDateTime from = startOfDay(window[0]);
        LocalDateTime to   = endOfDay(window[1]);

        List<Object[]> rows = stockHistoryRepository.getReasonBreakdown(
                from, to, blankToNull(supplierId), blankToNull(itemName));

        return rows.stream()
                .map(r -> new ReasonBreakdownDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue(),
                        asNumber(r[2]).longValue()
                ))
                .toList();
    }

    /**
     * Number of active items below their own minimum quantity (global KPI, no
     * supplier filter). Counts the same items the dashboard's low-stock list shows.
     * @return count of low-stock items
     */
    public long lowStockCount() {
        return inventoryItemRepository.countItemsBelowMinimumStock();
    }

    /**
     * Applies flexible filter criteria over stock updates.
     * Defaults to last 30 days when both date bounds are null.
     *
     * @param filter filter object with optional criteria (required, must not be null)
     * @return stock updates matching criteria, ordered by createdAt descending
     * @throws InvalidRequestException if filter is null or date/quantity ranges are inverted
     */
    public List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter) {
        LocalDateTime[] window = resolveFilterWindow(filter);
        LocalDateTime start = window[0];
        LocalDateTime end   = window[1];

        List<Object[]> rows = stockHistoryRepository.searchStockUpdates(
                start, end,
                blankToNull(filter.getItemName()),
                blankToNull(filter.getSupplierId()),
                blankToNull(filter.getCreatedBy()),
                filter.getMinChange(), filter.getMaxChange()
        );

        return rows.stream().map(StockAnalyticsService::toStockUpdate).toList();
    }

    /**
     * One page of {@link #getFilteredStockUpdates}: the same filters, defaults and
     * order, with the total number of matching rows.
     *
     * @param filter   filter object with optional criteria (required, must not be null)
     * @param pageable page index and size
     * @return the requested page of stock updates
     * @throws InvalidRequestException if filter is null or date/quantity ranges are inverted
     */
    public Page<StockUpdateResultDTO> getFilteredStockUpdatesPage(StockUpdateFilterDTO filter, Pageable pageable) {
        LocalDateTime[] window = resolveFilterWindow(filter);

        return stockHistoryRepository.searchStockUpdatesPage(
                window[0], window[1],
                blankToNull(filter.getItemName()),
                blankToNull(filter.getSupplierId()),
                blankToNull(filter.getCreatedBy()),
                filter.getMinChange(), filter.getMaxChange(),
                pageable
        ).map(StockAnalyticsService::toStockUpdate);
    }

    /** Maps one below-minimum row [name, quantity, minimumQuantity]; both public variants share it. */
    private static LowStockItemDTO toLowStockItem(Object[] r) {
        return new LowStockItemDTO((String) r[0], asNumber(r[1]).intValue(), asNumber(r[2]).intValue());
    }

    /** Maps one search row [item, supplier, change, reason, createdBy, createdAt]. */
    private static StockUpdateResultDTO toStockUpdate(Object[] r) {
        return new StockUpdateResultDTO(
                (String) r[0],
                (String) r[1],
                asNumber(r[2]).intValue(),
                (String) r[3],
                (String) r[4],
                asLocalDateTime(r[5]));
    }

    /**
     * Resolves the date window of a stock-update filter and validates the filter.
     *
     * <p>Applies the 30-day default only when both bounds are absent; a single
     * supplied bound is honoured as-is. This differs from the per-bound defaulting
     * in {@code defaultAndValidateDateWindow}, so it is kept as a dedicated helper.</p>
     *
     * @param filter filter object (required, must not be null)
     * @return normalized {@code [start, end]}; an element may be null when only one bound was supplied
     * @throws InvalidRequestException if filter is null or the date or quantity range is inverted
     */
    private static LocalDateTime[] resolveFilterWindow(StockUpdateFilterDTO filter) {
        if (filter == null) {
            throw new InvalidRequestException("filter must not be null");
        }
        LocalDateTime start = filter.getStartDate();
        LocalDateTime end   = filter.getEndDate();
        if (start == null && end == null) {
            end   = LocalDateTime.now();
            start = end.minusDays(30);
        }
        if (start != null && end != null && start.isAfter(end)) {
            throw new InvalidRequestException("startDate must be on or before endDate");
        }
        Integer min = filter.getMinChange();
        Integer max = filter.getMaxChange();
        if (min != null && max != null && min > max) {
            throw new InvalidRequestException("minChange must be <= maxChange");
        }
        return new LocalDateTime[]{ start, end };
    }

    /**
     * Returns average unit price per day for an item within a date window.
     *
     * <p>When the window has no row on its first day, the series opens with the
     * price in force at {@code start} (the last recorded price before it), dated
     * {@code start}. A price holds until it changes, so without that point an item
     * whose price did not change inside the window had no series at all.
     *
     * @param itemId     required inventory item identifier
     * @param supplierId optional supplier filter (null/blank = all suppliers)
     * @param start      inclusive start date (required)
     * @param end        inclusive end date (required)
     * @return day/price pairs ordered by date ascending
     * @throws InvalidRequestException if {@code itemId} is blank or {@code start > end}
     */
    public List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDate start, LocalDate end) {
        String iid = requireNonBlank(itemId, "itemId");
        LocalDate s = requireNonNull(start, "start");
        LocalDate e = requireNonNull(end, "end");

        if (s.isAfter(e)) {
            throw new InvalidRequestException("start must be on or before end");
        }

        // startOfDay/endOfDay so start and end dates are fully inclusive at TIMESTAMP precision
        List<PriceTrendDTO> window = stockHistoryRepository.getItemPriceTrend(iid, supplierId, startOfDay(s), endOfDay(e));
        return withOpeningPrice(window, iid, supplierId, s);
    }

    /**
     * Prepends the price in force at {@code start} unless the window already has a
     * point on that day. Nothing is added for an item without history before
     * {@code start}: it had no price yet.
     *
     * @param window     in-window points ordered by date ascending
     * @param itemId     item identifier
     * @param supplierId optional supplier filter
     * @param start      first day of the window
     * @return the window, possibly opened by one point dated {@code start}
     */
    private List<PriceTrendDTO> withOpeningPrice(List<PriceTrendDTO> window, String itemId, String supplierId, LocalDate start) {
        // day strings are ISO yyyy-MM-dd, so string order is date order
        if (!window.isEmpty() && window.get(0).getTimestamp().compareTo(start.toString()) <= 0) {
            return window;
        }
        List<BigDecimal> prior = stockHistoryRepository.findPricesBefore(
                itemId, blankToNull(supplierId), startOfDay(start), Limit.of(1));
        if (prior.isEmpty()) {
            return window;
        }
        List<PriceTrendDTO> opened = new ArrayList<>(window.size() + 1);
        opened.add(new PriceTrendDTO(start.toString(), prior.get(0)));
        opened.addAll(window);
        return opened;
    }
}
