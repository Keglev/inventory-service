package com.smartsupplypro.inventory.service.impl.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
 * <p>Exceeds the 200-line guideline due to private helper methods and per-method
 * inline documentation that must remain co-located for analytical coherence.</p>
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
     * Retrieves daily inventory value (quantity × price) over a date range.
     * Defaults to last 30 days when bounds are null.
     *
     * @param startDate inclusive start date (nullable)
     * @param endDate   inclusive end date (nullable)
     * @param supplierId optional supplier filter (null/blank = all suppliers)
     * @return daily stock values ordered by date ascending
     * @throws InvalidRequestException if {@code startDate > endDate}
     */
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate,
                                                                   LocalDate endDate,
                                                                   String supplierId) {
        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        // startOfDay/endOfDay used so the inclusive date bounds match TIMESTAMP column precision
        LocalDateTime from = startOfDay(window[0]);
        LocalDateTime to   = endOfDay(window[1]);

        List<Object[]> rows = stockHistoryRepository.getDailyStockValuation(from, to, blankToNull(supplierId));

        return rows.stream()
                .map(r -> new StockValueOverTimeDTO(
                        asLocalDate(r[0]),
                        asNumber(r[1]).doubleValue()
                ))
                .toList();
    }

    /**
     * Retrieves current stock quantities grouped by supplier.
     * @return suppliers with total quantities ordered by quantity descending
     */
    public List<StockPerSupplierDTO> getTotalStockPerSupplier() {
        List<Object[]> rows = stockHistoryRepository.getTotalStockBySupplier();

        return rows.stream()
                .map(r -> new StockPerSupplierDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue()
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

        return rows.stream()
                .map(r -> new LowStockItemDTO(
                        (String) r[0],
                        asNumber(r[1]).intValue(),
                        asNumber(r[2]).intValue()
                ))
                .toList();
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
     * Total items currently below minimum stock threshold (global KPI, no supplier filter).
     * @return count of low-stock items
     */
    public long lowStockCount() {
        return inventoryItemRepository.countWithQuantityBelow(5);
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
        if (filter == null) {
            throw new InvalidRequestException("filter must not be null");
        }

        LocalDateTime start = filter.getStartDate();
        LocalDateTime end   = filter.getEndDate();

        // Apply 30-day default only when both bounds are absent; partial bounds are honoured as-is
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

        List<Object[]> rows = stockHistoryRepository.searchStockUpdates(
                start, end,
                blankToNull(filter.getItemName()),
                blankToNull(filter.getSupplierId()),
                blankToNull(filter.getCreatedBy()),
                min, max
        );

        return rows.stream()
                .map(r -> new StockUpdateResultDTO(
                        (String) r[0],
                        (String) r[1],
                        asNumber(r[2]).intValue(),
                        (String) r[3],
                        (String) r[4],
                        asLocalDateTime(r[5])
                ))
                .toList();
    }

    /**
     * Returns average unit price per day for an item within a date window.
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
        return stockHistoryRepository.getItemPriceTrend(iid, supplierId, startOfDay(s), endOfDay(e));
    }
}
