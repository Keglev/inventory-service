package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.blankToNull;

import lombok.RequiredArgsConstructor;

/**
 * Default implementation of WAC-based financial analytics.
 *
 * <p>Replays the full stock event stream per item to maintain a running
 * Weighted Average Cost (WAC). Events before the requested period establish
 * the opening inventory baseline; events within the period are categorised into
 * purchases, returns, COGS, and write-offs.</p>
 *
 * <p><strong>WAC formula</strong>:
 * {@code newWAC = (oldQty × oldWAC + inboundQty × unitCost) / (oldQty + inboundQty)}</p>
 *
 * <p>Exceeds the 200-line guideline due to private WAC calculation helpers
 * ({@code applyInbound}, {@code issueAt}, phase helpers) that must remain
 * co-located for algorithmic coherence.</p>
 *
 * @see AnalyticsConverterHelper
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialAnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;

    // Reason sets define which financial bucket each outbound event belongs to
    private static final Set<StockChangeReason> RETURNS_IN =
            Set.of(StockChangeReason.RETURNED_BY_CUSTOMER);
    private static final Set<StockChangeReason> WRITE_OFFS =
            Set.of(StockChangeReason.DAMAGED, StockChangeReason.DESTROYED,
                   StockChangeReason.SCRAPPED, StockChangeReason.EXPIRED, StockChangeReason.LOST);
    private static final Set<StockChangeReason> RETURN_TO_SUPPLIER =
            Set.of(StockChangeReason.RETURNED_TO_SUPPLIER);

    /**
     * Produces a WAC financial summary for a date range.
     *
     * <p>Three-phase computation:
     * <ol>
     *   <li>Replay all events before {@code from} to establish opening WAC per item.</li>
     *   <li>Categorise events within [{@code from}, {@code to}] into financial buckets.</li>
     *   <li>Sum the final per-item state to derive ending inventory.</li>
     * </ol>
     *
     * @param from       inclusive start date (required)
     * @param to         inclusive end date (required)
     * @param supplierId optional supplier filter (null/blank = all suppliers)
     * @return WAC-based financial summary
     * @throws InvalidRequestException if dates are null or {@code from > to}
     */
    public FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId) {
        if (from == null || to == null) throw new InvalidRequestException("from/to must be provided");
        if (from.isAfter(to))          throw new InvalidRequestException("from must be on or before to");

        // LocalTime.MIN/MAX give full-day inclusive boundaries at TIMESTAMP precision
        LocalDateTime start = LocalDateTime.of(from, LocalTime.MIN);

        List<StockEventRowDTO> events =
                stockHistoryRepository.streamEventsForWAC(
                        LocalDateTime.of(to, LocalTime.MAX), blankToNull(supplierId));

        Map<String, WacState> state = new HashMap<>();
        FinancialBuckets b = new FinancialBuckets();

        processOpeningInventory(events, start, state);
        sumOpeningInventory(state, b);
        processPeriodEvents(events, start, state, b);
        sumEndingInventory(state, b);

        return buildSummary(from, to, b);
    }

    // ── Phase helpers ─────────────────────────────────────────────────────────

    /**
     * Replays all events that occurred before {@code start} to build the opening WAC
     * baseline per item. Events are processed in chronological order as supplied
     * by the repository query.
     */
    private void processOpeningInventory(List<StockEventRowDTO> events,
                                         LocalDateTime start,
                                         Map<String, WacState> state) {
        for (StockEventRowDTO e : events) {
            if (!e.createdAt().isBefore(start)) continue;

            WacState st = state.get(e.itemId());
            if (e.quantityChange() > 0) {
                state.put(e.itemId(), applyInbound(st, e.quantityChange(), resolveUnit(e.priceAtChange(), st)));
            } else if (e.quantityChange() < 0) {
                state.put(e.itemId(), issueAt(st, Math.abs(e.quantityChange())).state());
            }
        }
    }

    /** Sums per-item opening state into the opening quantity and value buckets. */
    private void sumOpeningInventory(Map<String, WacState> state, FinancialBuckets b) {
        for (WacState st : state.values()) {
            b.openingQty  += st.qty();
            b.openingValue = b.openingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }
    }

    /**
     * Processes events within the reporting period and routes each to the
     * correct financial bucket. WAC state is updated continuously.
     */
    private void processPeriodEvents(List<StockEventRowDTO> events,
                                     LocalDateTime start,
                                     Map<String, WacState> state,
                                     FinancialBuckets b) {
        for (StockEventRowDTO e : events) {
            if (e.createdAt().isBefore(start)) continue;

            WacState st = state.get(e.itemId());
            if (e.quantityChange() > 0) {
                processInboundEvent(e, st, state, b);
            } else if (e.quantityChange() < 0) {
                processOutboundEvent(e, st, state, b);
            }
        }
    }

    /** Routes a positive-quantity period event to the purchases or customer-returns bucket. */
    private void processInboundEvent(StockEventRowDTO e,
                                     WacState st,
                                     Map<String, WacState> state,
                                     FinancialBuckets b) {
        BigDecimal unit = resolveUnit(e.priceAtChange(), st);
        state.put(e.itemId(), applyInbound(st, e.quantityChange(), unit));
        BigDecimal cost = unit.multiply(BigDecimal.valueOf(e.quantityChange()));

        if (RETURNS_IN.contains(e.reason())) {
            b.returnsInQty  += e.quantityChange();
            b.returnsInCost  = b.returnsInCost.add(cost);
        } else if (e.priceAtChange() != null || e.reason() == StockChangeReason.INITIAL_STOCK) {
            // Only events with a price snapshot or INITIAL_STOCK reason count as purchases
            b.purchasesQty  += e.quantityChange();
            b.purchasesCost  = b.purchasesCost.add(cost);
        }
    }

    /** Routes a negative-quantity period event to COGS, write-offs, or returns-to-supplier. */
    private void processOutboundEvent(StockEventRowDTO e,
                                      WacState st,
                                      Map<String, WacState> state,
                                      FinancialBuckets b) {
        int out      = Math.abs(e.quantityChange());
        WacIssue iss = issueAt(st, out);
        state.put(e.itemId(), iss.state());

        if (RETURN_TO_SUPPLIER.contains(e.reason())) {
            // Returning to supplier reverses a purchase rather than creating a COGS entry
            b.purchasesQty  -= out;
            b.purchasesCost  = b.purchasesCost.subtract(iss.cost());
        } else if (WRITE_OFFS.contains(e.reason())) {
            b.writeOffQty   += out;
            b.writeOffCost   = b.writeOffCost.add(iss.cost());
        } else {
            b.cogsQty       += out;
            b.cogsCost       = b.cogsCost.add(iss.cost());
        }
    }

    /** Sums the final per-item WAC state into ending quantity and value buckets. */
    private void sumEndingInventory(Map<String, WacState> state, FinancialBuckets b) {
        for (WacState st : state.values()) {
            b.endingQty   += st.qty();
            b.endingValue  = b.endingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }
    }

    private FinancialSummaryDTO buildSummary(LocalDate from, LocalDate to, FinancialBuckets b) {
        return FinancialSummaryDTO.builder()
                .method("WAC")
                .fromDate(from.toString())
                .toDate(to.toString())
                .openingQty(b.openingQty)
                .openingValue(b.openingValue)
                .purchasesQty(b.purchasesQty)
                .purchasesCost(b.purchasesCost)
                .returnsInQty(b.returnsInQty)
                .returnsInCost(b.returnsInCost)
                .cogsQty(b.cogsQty)
                .cogsCost(b.cogsCost)
                .writeOffQty(b.writeOffQty)
                .writeOffCost(b.writeOffCost)
                .endingQty(b.endingQty)
                .endingValue(b.endingValue)
                .build();
    }

    // ── WAC algorithm — data structures ──────────────────────────────────────

    /** Current inventory state (running quantity + WAC) for a single item. */
    private record WacState(long qty, BigDecimal avgCost) {}

    /** Result of an outbound operation: updated state and the cost issued at WAC. */
    private record WacIssue(WacState state, BigDecimal cost) {}

    /** Mutable accumulator for all financial bucket totals across the reporting period. */
    private static class FinancialBuckets {
        long openingQty, purchasesQty, returnsInQty, cogsQty, writeOffQty, endingQty;
        BigDecimal openingValue  = BigDecimal.ZERO;
        BigDecimal purchasesCost = BigDecimal.ZERO;
        BigDecimal returnsInCost = BigDecimal.ZERO;
        BigDecimal cogsCost      = BigDecimal.ZERO;
        BigDecimal writeOffCost  = BigDecimal.ZERO;
        BigDecimal endingValue   = BigDecimal.ZERO;
    }

    // ── WAC algorithm — core operations ──────────────────────────────────────

    /**
     * Recalculates WAC after an inbound stock movement.
     *
     * <p>Formula: {@code newWAC = (oldQty × oldWAC + inboundQty × unitCost) / newQty}
     * — blends old and new costs proportionally when stock arrives at different prices.</p>
     */
    private static WacState applyInbound(WacState st, int qtyIn, BigDecimal unitCost) {
        long q0       = (st == null) ? 0 : st.qty();
        BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
        long q1       = q0 + qtyIn;

        BigDecimal avg1 = (q1 == 0) ? BigDecimal.ZERO
                : c0.multiply(BigDecimal.valueOf(q0))
                    .add(unitCost.multiply(BigDecimal.valueOf(qtyIn)))
                    .divide(BigDecimal.valueOf(q1), 4, RoundingMode.HALF_UP);

        return new WacState(q1, avg1);
    }

    /**
     * Issues (consumes) inventory at the current WAC.
     * WAC remains unchanged; only quantity is reduced.
     * Quantity is clamped to zero if the issue exceeds available stock.
     */
    private static WacIssue issueAt(WacState st, int qtyOut) {
        long q0       = (st == null) ? 0 : st.qty();
        BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
        long q1       = Math.max(0, q0 - qtyOut);
        return new WacIssue(new WacState(q1, c0), c0.multiply(BigDecimal.valueOf(qtyOut)));
    }

    /**
     * Resolves the unit cost for an inbound event.
     * Falls back to the current WAC when no price snapshot is recorded,
     * so events without a price do not reset the cost basis to zero.
     */
    private static BigDecimal resolveUnit(BigDecimal priceAtChange, WacState st) {
        if (priceAtChange != null) return priceAtChange;
        return (st == null) ? BigDecimal.ZERO : st.avgCost();
    }
}
