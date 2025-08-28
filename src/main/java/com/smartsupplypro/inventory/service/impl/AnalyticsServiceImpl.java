package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * Default read-only implementation of {@link AnalyticsService}.
 *
 * <p><strong>Responsibilities</strong></p>
 * <ul>
 *   <li>Validate inputs and enforce inclusive date-range semantics.</li>
 *   <li>Delegate to repositories and custom queries (native SQL/JPQL), remaining DB-agnostic
 *       at the service boundary.</li>
 *   <li>Map raw projection rows into stable DTOs, using safe cross-dialect casting.</li>
 * </ul>
 *
 * <p><strong>Portability</strong></p>
 * <ul>
 *   <li>H2 (test) and Oracle (prod) may surface numeric results as different JVM types
 *       (e.g., {@code BigDecimal}, {@code Long}). Always unbox via {@link Number}.</li>
 *   <li>Entity properties are used in JPQL (e.g., {@code createdAt}, {@code quantityChange});
 *       column names are used in native SQL (e.g., {@code created_at}, {@code quantity_change}).</li>
 * </ul>
 *
 * <p><strong>Transactions</strong></p>
 * <ul>
 *   <li>All methods are read-only: {@code @Transactional(readOnly = true)}.</li>
 *   <li>Any business-rule violations result in {@link InvalidRequestException}, which is expected
 *       to be mapped to HTTP 400 via the global exception handler.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /**
     * Retrieves the total inventory value (quantity × price) per day between two dates (inclusive),
     * optionally filtered by supplier.
     *
     * <p><strong>Defaults</strong>: if any bound is {@code null}, the window defaults to the last 30 days
     * ending today. The service validates {@code startDate &le; endDate}.</p>
     *
     * @param startDate inclusive start date (nullable for defaulting)
     * @param endDate   inclusive end date (nullable for defaulting)
     * @param supplierId optional supplier filter; {@code null/blank} means all suppliers
     * @return ordered list of daily points (ascending by date)
     * @throws InvalidRequestException if {@code startDate} is after {@code endDate}
     */
    @Override
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate,
                                                                  LocalDate endDate,
                                                                  String supplierId) {

        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        LocalDateTime from = startOfDay(window[0]);
        LocalDateTime to   = endOfDay(window[1]);

        List<Object[]> rows =
                stockHistoryRepository.getStockValueGroupedByDateFiltered(from, to, blankToNull(supplierId));

        // row[0] = DATE (java.sql.Date or LocalDate), row[1] = numeric total value
        return rows.stream()
                .map(r -> new StockValueOverTimeDTO(
                        asLocalDate(r[0]),
                        asNumber(r[1]).doubleValue() // DTO uses double for charting
                ))
                .toList();
    }

    /**
     * Returns the current total item quantity grouped by supplier (for pie/bar charts).
     *
     * <p>Backed by a native aggregation for performance; displays supplier name and total quantity.</p>
     *
     * @return list of supplier totals ordered by quantity descending
     */
    @Override
    public List<StockPerSupplierDTO> getTotalStockPerSupplier() {
        List<Object[]> rows = stockHistoryRepository.getTotalStockPerSupplier();

        // row[0] = supplier name, row[1] = numeric quantity
        return rows.stream()
                .map(r -> new StockPerSupplierDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue()
                ))
                .toList();
    }

    /**
     * Returns per-item update frequency for a required supplier.
     *
     * @param supplierId supplier identifier (must be non-blank)
     * @return list ordered by update count descending
     * @throws InvalidRequestException if {@code supplierId} is blank
     */
    @Override
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId) {
        String sid = requireNonBlank(supplierId, "supplierId");

        List<Object[]> rows = stockHistoryRepository.getUpdateCountPerItemFiltered(sid);

        // row[0] = item name, row[1] = numeric count
        return rows.stream()
                .map(r -> new ItemUpdateFrequencyDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue()
                ))
                .toList();
    }

    /**
     * Returns items below their configured minimum stock threshold for a required supplier.
     *
     * @param supplierId supplier identifier (must be non-blank)
     * @return list of low-stock items ordered by ascending quantity
     * @throws InvalidRequestException if {@code supplierId} is blank
     */
    @Override
    public List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId) {
        String sid = requireNonBlank(supplierId, "supplierId");

        List<Object[]> rows = inventoryItemRepository.findItemsBelowMinimumStockFiltered(sid);

        // row = [name, quantity, minimum_quantity]
        return rows.stream()
                .map(r -> new LowStockItemDTO(
                        (String) r[0],
                        asNumber(r[1]).intValue(),
                        asNumber(r[2]).intValue()
                ))
                .toList();
    }

    /**
     * Returns monthly stock movement (stock-in/stock-out) between two dates (inclusive),
     * optionally filtered by supplier.
     *
     * <p><strong>Defaults</strong>: if bounds are {@code null}, the window defaults to the last 30 days
     * ending today. The service validates {@code startDate &le; endDate}.</p>
     *
     * @param startDate inclusive start date (nullable for defaulting)
     * @param endDate   inclusive end date (nullable for defaulting)
     * @param supplierId optional supplier filter; {@code null/blank} means all suppliers
     * @return list of monthly aggregates ordered by month ascending; each DTO contains
     *         {@code monthKey (YYYY-MM)}, {@code stockIn}, {@code stockOut}
     * @throws InvalidRequestException if {@code startDate} is after {@code endDate}
     */
    @Override
    public List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate,
                                                                 LocalDate endDate,
                                                                 String supplierId) {

        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        LocalDateTime from = startOfDay(window[0]);
        LocalDateTime to   = endOfDay(window[1]);

        List<Object[]> rows =
                stockHistoryRepository.getMonthlyStockMovementFiltered(from, to, blankToNull(supplierId));

        // row = [YYYY-MM, stockIn, stockOut]
        return rows.stream()
                .map(r -> new MonthlyStockMovementDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue(),
                        asNumber(r[2]).longValue()
                ))
                .toList();
    }

    /**
     * Applies a flexible filter over stock updates with date/supplier/item/user/quantity bounds.
     *
     * <p><strong>Defaults</strong>:
     * if both {@code startDate} and {@code endDate} are {@code null}, the window defaults to the
     * last 30 days ending at the current time.</p>
     *
     * <p><strong>Validation</strong>:
     * {@code startDate &le; endDate}; if {@code minChange} and {@code maxChange} are both present,
     * then {@code minChange &le; maxChange}.</p>
     *
     * <p>Blank text filters are normalized to {@code null} to indicate "no filter".</p>
     *
     * @param filter filter object containing optional criteria
     * @return list ordered by newest event first (createdAt DESC)
     * @throws InvalidRequestException if validation fails or filter is {@code null}
     */
    @Override
    public List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter) {
        if (filter == null) {
            throw new InvalidRequestException("filter must not be null");
        }

        LocalDateTime start = filter.getStartDate();
        LocalDateTime end   = filter.getEndDate();

        if (start == null && end == null) {
            end = LocalDateTime.now();
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

        // Pass null for blank text filters (so repo ignores them)
        String itemName   = blankToNull(filter.getItemName());
        String supplierId = blankToNull(filter.getSupplierId());
        String createdBy  = blankToNull(filter.getCreatedBy());

        List<Object[]> rows = stockHistoryRepository.findFilteredStockUpdates(
                start, end, itemName, supplierId, createdBy, min, max
        );

        // row = [itemName, supplierName, qtyChange, reason, createdBy, createdAt]
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
     * Returns the average unit price per day for a specific item within a date window (inclusive),
     * optionally filtered by supplier.
     *
     * <p>Delegates to a custom repository method that aggregates by day using the entity's
     * {@code createdAt} property / {@code created_at} column.</p>
     *
     * @param itemId     required inventory item identifier
     * @param supplierId optional supplier filter; {@code null/blank} means all suppliers
     * @param start      inclusive start date
     * @param end        inclusive end date
     * @return ordered list of day/price pairs (ascending by date)
     * @throws InvalidRequestException if {@code itemId} is blank or {@code start} &gt; {@code end}
     */
    @Override
    public List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDate start, LocalDate end) {
        String iid = requireNonBlank(itemId, "itemId");
        LocalDate s = requireNonNull(start, "start");
        LocalDate e = requireNonNull(end, "end");
        if (s.isAfter(e)) {
            throw new InvalidRequestException("start must be on or before end");
        }

        LocalDateTime from = startOfDay(s);
        LocalDateTime to   = endOfDay(e);

        return stockHistoryRepository.getPriceTrend(iid, supplierId, from, to);
    }

    /**
     * Produces a financial summary for a period using the Weighted Average Cost (WAC) method.
     *
     * <p><strong>Computation model</strong></p>
     * <ol>
     *   <li><em>Opening inventory</em> is obtained by replaying all events strictly before {@code from}
     *       to build per-item running quantity and moving average cost.</li>
     *   <li>Within [{@code from}..{@code to}], events contribute to buckets:
     *     <ul>
     *       <li><em>Purchases</em>: positive changes with a unit price, plus optional {@code INITIAL_STOCK}.</li>
     *       <li><em>Returns In</em>: positive changes with reason {@code RETURNED_BY_CUSTOMER}.</li>
     *       <li><em>Write-offs</em>: negative changes with reasons
     *           {@code DAMAGED}, {@code DESTROYED}, {@code SCRAPPED}, {@code EXPIRED}, {@code LOST}.</li>
     *       <li><em>Return to Supplier</em>: negative changes with {@code RETURNED_TO_SUPPLIER}
     *           (treated as negative purchases at current WAC).</li>
     *       <li><em>COGS/Consumption</em>: all other negative changes valued at current WAC.</li>
     *     </ul>
     *   </li>
     *   <li><em>Ending inventory</em> equals the final per-item state after processing all events up to {@code to}.</li>
     * </ol>
     *
     * <p><strong>Notes</strong></p>
     * <ul>
     *   <li>If an inbound event lacks {@code priceAtChange}, the current moving average is used
     *       to maintain cost continuity.</li>
     *   <li>The algorithm guards against negative on-hand quantities caused by data issues by clamping at zero.</li>
     *   <li>All values are computed with scale 4 and {@link RoundingMode#HALF_UP} for intermediate averages.</li>
     * </ul>
     *
     * @param from       inclusive start date
     * @param to         inclusive end date
     * @param supplierId optional supplier filter (events for other suppliers are ignored when provided)
     * @return WAC-based {@link FinancialSummaryDTO} with opening/ending, purchases, returns, COGS, and write-offs
     * @throws InvalidRequestException if any bound is {@code null} or {@code from} &gt; {@code to}
     */
    @Override
    public FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId) {
        if (from == null || to == null) throw new InvalidRequestException("from/to must be provided");
        if (from.isAfter(to)) throw new InvalidRequestException("from must be on or before to");

        LocalDateTime start = LocalDateTime.of(from, LocalTime.MIN);
        LocalDateTime end   = LocalDateTime.of(to,   LocalTime.MAX);

        // Stream all events up to 'end' (ordered by item, then createdAt).
        var events = stockHistoryRepository.findEventsUpTo(end, blankToNull(supplierId));

        // Aggregate buckets
        long openingQty = 0, purchasesQty = 0, returnsInQty = 0, cogsQty = 0, writeOffQty = 0, endingQty = 0;
        BigDecimal openingValue = BigDecimal.ZERO, purchasesCost = BigDecimal.ZERO, returnsInCost = BigDecimal.ZERO,
                   cogsCost = BigDecimal.ZERO, writeOffCost = BigDecimal.ZERO, endingValue = BigDecimal.ZERO;

        // Per-item state map (uses class-level record State to track quantity and average cost)
        Map<String, State> state = new HashMap<>();

        // Reason sets (align with enum)
        final Set<StockChangeReason> RETURNS_IN = Set.of(StockChangeReason.RETURNED_BY_CUSTOMER);
        final Set<StockChangeReason> WRITE_OFFS = Set.of(
                StockChangeReason.DAMAGED, StockChangeReason.DESTROYED,
                StockChangeReason.SCRAPPED, StockChangeReason.EXPIRED, StockChangeReason.LOST
        );
        final Set<StockChangeReason> RETURN_TO_SUPPLIER = Set.of(StockChangeReason.RETURNED_TO_SUPPLIER);

        // 1) Opening state: replay events strictly before 'start'
        for (var e : events) {
            if (e.createdAt().isBefore(start)) {
                State st = state.get(e.itemId());
                if (e.quantityChange() > 0) {
                    BigDecimal unit = (e.priceAtChange() != null)
                            ? e.priceAtChange()
                            : (st == null ? BigDecimal.ZERO : st.avgCost());
                    st = applyInbound(st, e.quantityChange(), unit);
                    state.put(e.itemId(), st);
                } else if (e.quantityChange() < 0) {
                    Issue iss = issueAt(st, Math.abs(e.quantityChange()));
                    state.put(e.itemId(), iss.state());
                }
            }
        }
        for (var st : state.values()) {
            openingQty += st.qty();
            openingValue = openingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }

        // 2) In-window aggregation: [start..end]
        for (var e : events) {
            if (e.createdAt().isBefore(start)) continue;

            State st = state.get(e.itemId());

            if (e.quantityChange() > 0) {
                BigDecimal unit = (e.priceAtChange() != null)
                        ? e.priceAtChange()
                        : (st == null ? BigDecimal.ZERO : st.avgCost());
                State newSt = applyInbound(st, e.quantityChange(), unit);
                state.put(e.itemId(), newSt);

                if (RETURNS_IN.contains(e.reason())) {
                    returnsInQty += e.quantityChange();
                    returnsInCost = returnsInCost.add(unit.multiply(BigDecimal.valueOf(e.quantityChange())));
                } else {
                    if (e.priceAtChange() != null || e.reason() == StockChangeReason.INITIAL_STOCK) {
                        purchasesQty += e.quantityChange();
                        purchasesCost = purchasesCost.add(unit.multiply(BigDecimal.valueOf(e.quantityChange())));
                    }
                    // Positive manual adjustments without price affect WAC/qty but not purchases bucket.
                }

            } else if (e.quantityChange() < 0) {
                int out = Math.abs(e.quantityChange());

                if (RETURN_TO_SUPPLIER.contains(e.reason())) {
                    Issue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    // Treat as negative purchases at current WAC
                    purchasesQty -= out;
                    purchasesCost = purchasesCost.subtract(iss.cost());

                } else if (WRITE_OFFS.contains(e.reason())) {
                    Issue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    writeOffQty += out;
                    writeOffCost = writeOffCost.add(iss.cost());

                } else {
                    // Default: COGS / consumption
                    Issue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    cogsQty += out;
                    cogsCost = cogsCost.add(iss.cost());
                }
            }
            // quantityChange == 0 (e.g., price-only adjustments) are ignored here.
        }

        // 3) Ending inventory from final state
        for (var st : state.values()) {
            endingQty += st.qty();
            endingValue = endingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }

        return FinancialSummaryDTO.builder()
                .method("WAC")
                .fromDate(from.toString())
                .toDate(to.toString())
                .openingQty(openingQty)
                .openingValue(openingValue)
                .purchasesQty(purchasesQty)
                .purchasesCost(purchasesCost)
                .returnsInQty(returnsInQty)
                .returnsInCost(returnsInCost)
                .cogsQty(cogsQty)
                .cogsCost(cogsCost)
                .writeOffQty(writeOffQty)
                .writeOffCost(writeOffCost)
                .endingQty(endingQty)
                .endingValue(endingValue)
                .build();
    }

    // ---------------------------------------------------------------------
    // Helpers (validation, casting, defaults)
    // ---------------------------------------------------------------------

    /**
     * Applies defaults for a date window (last 30 days ending today) and validates {@code start <= end}.
     *
     * @param start nullable inclusive start date
     * @param end   nullable inclusive end date
     * @return a 2-element array containing the effective start and end
     * @throws InvalidRequestException if the effective start is after the effective end
     */
    private static LocalDate[] defaultAndValidateDateWindow(LocalDate start, LocalDate end) {
        LocalDate s = (start == null) ? LocalDate.now().minusDays(30) : start;
        LocalDate e = (end == null) ? LocalDate.now() : end;
        if (s.isAfter(e)) {
            throw new InvalidRequestException("start must be on or before end");
        }
        return new LocalDate[]{s, e};
    }

    /** @return start of day (00:00:00.000000000) for the given date. */
    private static LocalDateTime startOfDay(LocalDate d) {
        return LocalDateTime.of(d, LocalTime.MIN);
    }

    /** @return end of day (23:59:59.999999999) for the given date. */
    private static LocalDateTime endOfDay(LocalDate d) {
        return LocalDateTime.of(d, LocalTime.MAX);
    }

    /** Normalizes a String to {@code null} if blank; otherwise returns a trimmed value. */
    private static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }

    /** Ensures a String is non-blank; returns trimmed value or throws {@link InvalidRequestException}. */
    private static String requireNonBlank(String v, String name) {
        if (v == null || v.trim().isEmpty()) {
            throw new InvalidRequestException(name + " must not be blank");
        }
        return v.trim();
    }

    /** Ensures a reference is non-null; returns it or throws {@link InvalidRequestException}. */
    private static <T> T requireNonNull(T v, String name) {
        if (v == null) {
            throw new InvalidRequestException(name + " must not be null");
        }
        return v;
    }

    /**
     * Converts a date-like object to {@link LocalDate}.
     * Accepts {@link LocalDate} or {@link java.sql.Date}.
     *
     * @throws IllegalStateException if the object type is unsupported
     */
    private static LocalDate asLocalDate(Object o) {
        if (o instanceof LocalDate ld) return ld;
        if (o instanceof Date d) return d.toLocalDate();
        throw new IllegalStateException("Expected LocalDate or java.sql.Date but got: " + o);
    }

    /**
     * Converts a timestamp-like object to {@link LocalDateTime}.
     * Accepts {@link LocalDateTime} or {@link java.sql.Timestamp}.
     *
     * @throws IllegalStateException if the object type is unsupported
     */
    private static LocalDateTime asLocalDateTime(Object o) {
        if (o instanceof LocalDateTime ldt) return ldt;
        if (o instanceof Timestamp ts) return ts.toLocalDateTime();
        throw new IllegalStateException("Expected LocalDateTime or java.sql.Timestamp but got: " + o);
    }

    /**
     * Safely unboxes any numeric projection value via {@link Number}.
     * This is resilient across H2/Oracle which may use different numeric classes.
     *
     * @throws IllegalStateException if the object is not a Number
     */
    private static Number asNumber(Object o) {
        if (o instanceof Number n) return n;
        if (o instanceof BigDecimal bd) return bd; // explicit for clarity
        throw new IllegalStateException("Expected numeric type but got: " + o);
    }

    /** Internal WAC state per item. */
    private record State(long qty, BigDecimal avgCost) {}

    private record Issue(State state, BigDecimal cost) {}

    /** Apply inbound at a given unit cost and recompute moving average cost. */
    private static State applyInbound(State st, int qtyIn, BigDecimal unitCost) {
        long q0 = (st == null) ? 0 : st.qty();
        BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
        long q1 = q0 + qtyIn;
        BigDecimal v0  = c0.multiply(BigDecimal.valueOf(q0));
        BigDecimal vin = unitCost.multiply(BigDecimal.valueOf(qtyIn));
        BigDecimal avg1 = (q1 == 0)
                ? BigDecimal.ZERO
                : v0.add(vin).divide(BigDecimal.valueOf(q1), 4, RoundingMode.HALF_UP);
        return new State(q1, avg1);
    }

    /** Issue (consume) quantity at current WAC and return new state + cost of the issue. */
    private static Issue issueAt(State st, int qtyOut) {
        long q0 = (st == null) ? 0 : st.qty();
        BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
        long q1 = q0 - qtyOut;
        if (q1 < 0) q1 = 0; // guard
        BigDecimal cost = c0.multiply(BigDecimal.valueOf(qtyOut));
        return new Issue(new State(q1, c0), cost);
    }

}
