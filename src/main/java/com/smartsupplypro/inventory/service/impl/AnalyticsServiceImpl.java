package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.*;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.repository.custom.StockHistoryCustomRepository;
import com.smartsupplypro.inventory.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * Read-only implementation of {@link AnalyticsService}.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Validate inputs and enforce inclusive date ranges.</li>
 *   <li>Delegate to repositories/custom queries.</li>
 *   <li>Map raw query rows to stable DTOs using safe, cross-dialect casting.</li>
 * </ul>
 *
 * <p><strong>DB portability:</strong> Use {@code Number} when unboxing numeric columns; H2/Oracle
 * may return different numeric types (e.g., {@code BigDecimal}, {@code BigInteger}, {@code Long}).</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final StockHistoryCustomRepository stockHistoryCustomRepository;


    /**
     * Daily total stock value between dates (inclusive).
     *
     * <p>Defaults: if any bound is null, uses last 30 days ending at today.</p>
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
                        asNumber(r[1]).doubleValue()   // DTO uses double for charting
                ))
                .toList();
    }

    /**
     * Current total stock grouped by supplier.
     *
     * <p>Backed by a custom query for performance. Returns display name + total quantity.</p>
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
     * Per-item update frequency for a required supplier.
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
     * Items below minimum threshold for a required supplier.
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
     * Monthly stock movement (in/out) between dates (inclusive).
     *
     * <p>Defaults: if bounds are null, uses last 30 days ending today.</p>
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
     * Filtered stock history with defaults and guardrails.
     *
     * <p>Defaults: if both dates are null, last 30 days to now.</p>
     * <p>Validation: start <= end, minChange <= maxChange (if both present).</p>
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

        // row = [itemName, supplierName, qtyChange, reason, createdBy, timestamp]
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
     * Price trend for an item between dates (inclusive), optional supplier filter.
     *
     * <p>Delegates to custom repository implementation (may ignore supplier when null).</p>
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

        // Custom repo method expected (supplierId may be applied inside)
        return stockHistoryRepository.getPriceTrend(iid, supplierId, from, to);
    }

    @Override
    public FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId) {
        if (from == null || to == null) throw new InvalidRequestException("from/to must be provided");
        if (from.isAfter(to)) throw new InvalidRequestException("from must be on or before to");

        LocalDateTime start = LocalDateTime.of(from, LocalTime.MIN);
        LocalDateTime end   = LocalDateTime.of(to,   LocalTime.MAX);

        // Fetch all events up to 'end' (ordered by item, then time).
        var events = stockHistoryCustomRepository.findEventsUpTo(end, blankToNull(supplierId));

        // Buckets
        long openingQty = 0, purchasesQty = 0, returnsInQty = 0, cogsQty = 0, writeOffQty = 0, endingQty = 0;
        BigDecimal openingValue = BigDecimal.ZERO, purchasesCost = BigDecimal.ZERO, returnsInCost = BigDecimal.ZERO,
                   cogsCost = BigDecimal.ZERO, writeOffCost = BigDecimal.ZERO, endingValue = BigDecimal.ZERO;

        // State per item for WAC
        record State(long qty, BigDecimal avgCost) {}
        Map<String, State> state = new HashMap<>();

        // Helper ops
        record Inbound(int qty, BigDecimal unitCost) {}
        record Issue(State state, BigDecimal cost) {}

        // Apply inbound at given unit cost, recompute WAC
        var inbound = (java.util.function.BiFunction<State, Inbound, State>) (st, in) -> {
            long q0 = (st == null) ? 0 : st.qty();
            BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
            long q1 = q0 + in.qty();
            BigDecimal v0 = c0.multiply(BigDecimal.valueOf(q0));
            BigDecimal vin = in.unitCost().multiply(BigDecimal.valueOf(in.qty()));
            BigDecimal avg1 = (q1 == 0) ? BigDecimal.ZERO : v0.add(vin).divide(BigDecimal.valueOf(q1), 4, RoundingMode.HALF_UP);
            return new State(q1, avg1);
        };
        // Issue at current WAC
        var issueAt = (java.util.function.BiFunction<State, Integer, Issue>) (st, outQty) -> {
            long q0 = (st == null) ? 0 : st.qty();
            BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
            long q1 = q0 - outQty;
            if (q1 < 0) q1 = 0; // guard against negative due to data errors
            BigDecimal cost = c0.multiply(BigDecimal.valueOf(outQty));
            return new Issue(new State(q1, c0), cost);
        };

        // Reason sets (from your enum)
        // Inbound purchases = positive change with priceAtChange!=null (generic), plus INITIAL_STOCK
        // Customer returns tracked separately
        final Set<StockChangeReason> RETURNS_IN = Set.of(StockChangeReason.RETURNED_BY_CUSTOMER);
        final Set<StockChangeReason> WRITE_OFFS = Set.of(
                StockChangeReason.DAMAGED, StockChangeReason.DESTROYED,
                StockChangeReason.SCRAPPED, StockChangeReason.EXPIRED, StockChangeReason.LOST
        );
        final Set<StockChangeReason> COGS_OUT = Set.of(StockChangeReason.SOLD); // extend if you have SHIPPED/CONSUMPTION
        final Set<StockChangeReason> RETURN_TO_SUPPLIER = Set.of(StockChangeReason.RETURNED_TO_SUPPLIER);

        // 1) Build opening state (events strictly before 'start')
        for (var e : events) {
            if (e.timestamp().isBefore(start)) {
                State st = state.get(e.itemId());
                if (e.change() > 0) {
                    // treat as inbound; pick unit cost: if price missing, use current WAC
                    BigDecimal unit = (e.priceAtChange() != null) ? e.priceAtChange() : (st == null ? BigDecimal.ZERO : st.avgCost());
                    st = inbound.apply(st, new Inbound(e.change(), unit));
                    state.put(e.itemId(), st);
                } else if (e.change() < 0) {
                    var iss = issueAt.apply(st, Math.abs(e.change()));
                    state.put(e.itemId(), iss.state());
                }
            }
        }
        for (var st : state.values()) {
            openingQty += st.qty();
            openingValue = openingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }

        // 2) Aggregate within [start..end]
        for (var e : events) {
            if (e.timestamp().isBefore(start)) continue;

            State st = state.get(e.itemId());

            if (e.change() > 0) {
                BigDecimal unit = (e.priceAtChange() != null) ? e.priceAtChange() : (st == null ? BigDecimal.ZERO : st.avgCost());
                State newSt = inbound.apply(st, new Inbound(e.change(), unit));
                state.put(e.itemId(), newSt);

                if (RETURNS_IN.contains(e.reason())) {
                    returnsInQty += e.change();
                    // Returns back to inventory are valued at current WAC (approximation if price unknown)
                    returnsInCost = returnsInCost.add(unit.multiply(BigDecimal.valueOf(e.change())));
                } else {
                    // Treat as purchases if a unit price is provided or if INITIAL_STOCK
                    if (e.priceAtChange() != null || e.reason() == StockChangeReason.INITIAL_STOCK) {
                        purchasesQty += e.change();
                        purchasesCost = purchasesCost.add(unit.multiply(BigDecimal.valueOf(e.change())));
                    }
                    // else: positive manual adjustments without price do affect WAC/qty but not counted as purchases
                }

            } else if (e.change() < 0) {
                var out = Math.abs(e.change());

                if (RETURN_TO_SUPPLIER.contains(e.reason())) {
                    var iss = issueAt.apply(st, out);
                    state.put(e.itemId(), iss.state());
                    // Option: treat as negative purchases (reduces net purchases)
                    purchasesQty -= out;
                    purchasesCost = purchasesCost.subtract(iss.cost());
                } else if (WRITE_OFFS.contains(e.reason())) {
                    var iss = issueAt.apply(st, out);
                    state.put(e.itemId(), iss.state());
                    writeOffQty += out;
                    writeOffCost = writeOffCost.add(iss.cost());
                } else {
                    // default: COGS / consumption
                    var iss = issueAt.apply(st, out);
                    state.put(e.itemId(), iss.state());
                    cogsQty += out;
                    cogsCost = cogsCost.add(iss.cost());
                }
            }
            // ignore change==0 events (e.g., PRICE_CHANGE)
        }

        // 3) Ending from final state
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

    private static LocalDate[] defaultAndValidateDateWindow(LocalDate start, LocalDate end) {
        LocalDate s = (start == null) ? LocalDate.now().minusDays(30) : start;
        LocalDate e = (end == null) ? LocalDate.now() : end;
        if (s.isAfter(e)) {
            throw new InvalidRequestException("start must be on or before end");
        }
        return new LocalDate[]{s, e};
    }

    private static LocalDateTime startOfDay(LocalDate d) {
        return LocalDateTime.of(d, LocalTime.MIN);
    }

    private static LocalDateTime endOfDay(LocalDate d) {
        return LocalDateTime.of(d, LocalTime.MAX);
    }

    private static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }

    private static String requireNonBlank(String v, String name) {
        if (v == null || v.trim().isEmpty()) {
            throw new InvalidRequestException(name + " must not be blank");
        }
        return v.trim();
    }

    private static <T> T requireNonNull(T v, String name) {
        if (v == null) {
            throw new InvalidRequestException(name + " must not be null");
        }
        return v;
    }

    private static LocalDate asLocalDate(Object o) {
        if (o instanceof LocalDate ld) return ld;
        if (o instanceof Date d) return d.toLocalDate();
        throw new IllegalStateException("Expected LocalDate or java.sql.Date but got: " + o);
    }

    private static LocalDateTime asLocalDateTime(Object o) {
        if (o instanceof LocalDateTime ldt) return ldt;
        if (o instanceof Timestamp ts) return ts.toLocalDateTime();
        throw new IllegalStateException("Expected LocalDateTime or java.sql.Timestamp but got: " + o);
    }

    private static Number asNumber(Object o) {
        if (o instanceof Number n) return n;
        if (o instanceof BigDecimal bd) return bd; // (covered by Number, but explicit for clarity)
        throw new IllegalStateException("Expected numeric type but got: " + o);
    }
}
