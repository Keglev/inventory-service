package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.blankToNull;

import lombok.RequiredArgsConstructor;

/**
 * Financial analytics service implementing Weighted Average Cost (WAC) calculations.
 *
 * <p>Provides comprehensive financial summaries by replaying stock events to calculate:
 * <ul>
 *   <li>Opening inventory (quantity and value at period start)</li>
 *   <li>Purchases (new stock acquisitions with costs)</li>
 *   <li>Returns (customer returns, returns to supplier)</li>
 *   <li>Cost of Goods Sold - COGS (items sold at WAC)</li>
 *   <li>Write-offs (damaged, lost, expired items)</li>
 *   <li>Ending inventory (quantity and value at period end)</li>
 * </ul>
 *
 * <p><strong>WAC Algorithm</strong>: Maintains running weighted average cost per item by
 * blending old and new costs proportionally when stock arrives at different prices.
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 * @see <a href="../../../../../../../docs/architecture/services/analytics-service.md#wac-algorithm">WAC Algorithm</a>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialAnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;

    // === Reason Categories for Financial Buckets ===
    private static final Set<StockChangeReason> RETURNS_IN = Set.of(StockChangeReason.RETURNED_BY_CUSTOMER);
    private static final Set<StockChangeReason> WRITE_OFFS = Set.of(
            StockChangeReason.DAMAGED, StockChangeReason.DESTROYED,
            StockChangeReason.SCRAPPED, StockChangeReason.EXPIRED, StockChangeReason.LOST
    );
    private static final Set<StockChangeReason> RETURN_TO_SUPPLIER = Set.of(StockChangeReason.RETURNED_TO_SUPPLIER);

    /**
     * Produces financial summary using Weighted Average Cost (WAC) method.
     *
     * <p><strong>Computation Model</strong>:
     * <ol>
     *   <li>Opening inventory: Replay events before period to establish baseline WAC per item</li>
     *   <li>Period events: Categorize into purchases, returns, COGS, write-offs, returns to supplier</li>
     *   <li>Ending inventory: Final state after processing all events</li>
     * </ol>
     *
     * <p><strong>WAC Formula</strong>: {@code newWAC = (oldQty × oldWAC + inboundQty × unitCost) / newQty}
     *
     * <p><strong>Financial Equation</strong>:
     * <pre>
     * Opening Value + Purchases Cost + Returns In Cost - COGS Cost - Write-off Cost = Ending Value
     * </pre>
     *
     * @param from inclusive start date (required)
     * @param to inclusive end date (required)
     * @param supplierId optional supplier filter ({@code null/blank} = all suppliers)
     * @return WAC-based financial summary with all categories
     * @throws InvalidRequestException if {@code from/to} is {@code null} or {@code from > to}
     */
    public FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId) {
        // === Input Validation ===
        if (from == null || to == null) throw new InvalidRequestException("from/to must be provided");
        if (from.isAfter(to)) throw new InvalidRequestException("from must be on or before to");

        // Convert LocalDate to LocalDateTime boundaries (inclusive range)
        LocalDateTime start = LocalDateTime.of(from, LocalTime.MIN);  // 00:00:00.000
        LocalDateTime end   = LocalDateTime.of(to,   LocalTime.MAX);  // 23:59:59.999

        // === Fetch Event Stream ===
        var events = stockHistoryRepository.streamEventsForWAC(end, blankToNull(supplierId));

        // === Initialize Financial Buckets ===
        long openingQty = 0, purchasesQty = 0, returnsInQty = 0, cogsQty = 0, writeOffQty = 0, endingQty = 0;
        BigDecimal openingValue = BigDecimal.ZERO,
                   purchasesCost = BigDecimal.ZERO,
                   returnsInCost = BigDecimal.ZERO,
                   cogsCost = BigDecimal.ZERO,
                   writeOffCost = BigDecimal.ZERO,
                   endingValue = BigDecimal.ZERO;

        // === Per-Item State Tracking (itemId → State) ===
        Map<String, WacState> state = new HashMap<>();

        // === PHASE 1: Opening Inventory (events before period start) ===
        for (var e : events) {
            if (e.createdAt().isBefore(start)) {
                WacState st = state.get(e.itemId());
                
                if (e.quantityChange() > 0) {
                    // Inbound: determine unit cost and update WAC
                    BigDecimal unit = (e.priceAtChange() != null)
                            ? e.priceAtChange()
                            : (st == null ? BigDecimal.ZERO : st.avgCost());
                    st = applyInbound(st, e.quantityChange(), unit);
                    state.put(e.itemId(), st);
                    
                } else if (e.quantityChange() < 0) {
                    // Outbound: issue at current WAC
                    WacIssue iss = issueAt(st, Math.abs(e.quantityChange()));
                    state.put(e.itemId(), iss.state());
                }
            }
        }
        
        // Sum opening inventory across all items
        for (var st : state.values()) {
            openingQty += st.qty();
            openingValue = openingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }

        // === PHASE 2: Process Events Within Period [start..end] ===
        for (var e : events) {
            if (e.createdAt().isBefore(start)) continue;

            WacState st = state.get(e.itemId());

            if (e.quantityChange() > 0) {
                // === INBOUND: Purchases, Returns ===
                BigDecimal unit = (e.priceAtChange() != null)
                        ? e.priceAtChange()
                        : (st == null ? BigDecimal.ZERO : st.avgCost());
                
                WacState newSt = applyInbound(st, e.quantityChange(), unit);
                state.put(e.itemId(), newSt);

                if (RETURNS_IN.contains(e.reason())) {
                    // Customer returns
                    returnsInQty += e.quantityChange();
                    returnsInCost = returnsInCost.add(unit.multiply(BigDecimal.valueOf(e.quantityChange())));
                } else {
                    // Purchases (includes INITIAL_STOCK or entries with price)
                    if (e.priceAtChange() != null || e.reason() == StockChangeReason.INITIAL_STOCK) {
                        purchasesQty += e.quantityChange();
                        purchasesCost = purchasesCost.add(unit.multiply(BigDecimal.valueOf(e.quantityChange())));
                    }
                }

            } else if (e.quantityChange() < 0) {
                // === OUTBOUND: Sales, Write-offs, Returns to Supplier ===
                int out = Math.abs(e.quantityChange());

                if (RETURN_TO_SUPPLIER.contains(e.reason())) {
                    // Returning to supplier → negative purchase
                    WacIssue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    purchasesQty -= out;
                    purchasesCost = purchasesCost.subtract(iss.cost());

                } else if (WRITE_OFFS.contains(e.reason())) {
                    // Damaged, lost, expired, etc.
                    WacIssue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    writeOffQty += out;
                    writeOffCost = writeOffCost.add(iss.cost());

                } else {
                    // Default: COGS (Cost of Goods Sold)
                    WacIssue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    cogsQty += out;
                    cogsCost = cogsCost.add(iss.cost());
                }
            }
        }

        // === PHASE 3: Calculate Ending Inventory ===
        for (var st : state.values()) {
            endingQty += st.qty();
            endingValue = endingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }

        // === Build Financial Summary DTO ===
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

    // === WAC Algorithm - Core Data Structures ===

    /** Represents current inventory state (qty + WAC) for a single item. */
    private record WacState(long qty, BigDecimal avgCost) {}

    /** Result of outbound operation (updated state + cost at WAC). */
    private record WacIssue(WacState state, BigDecimal cost) {}

    // === WAC Algorithm - Core Operations ===

    /**
     * Applies inbound stock movement and recalculates WAC.
     *
     * <p><strong>Formula</strong>:
     * <pre>
     * newWAC = (oldQty × oldWAC + inboundQty × unitCost) / (oldQty + inboundQty)
     * </pre>
     *
     * @param st current state (nullable for first purchase)
     * @param qtyIn quantity being added (positive)
     * @param unitCost unit cost of inbound stock
     * @return new state with updated quantity and recalculated WAC
     */
    private static WacState applyInbound(WacState st, int qtyIn, BigDecimal unitCost) {
        long q0 = (st == null) ? 0 : st.qty();
        BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
        
        long q1 = q0 + qtyIn;
        BigDecimal v0  = c0.multiply(BigDecimal.valueOf(q0));
        BigDecimal vin = unitCost.multiply(BigDecimal.valueOf(qtyIn));
        
        BigDecimal avg1 = (q1 == 0)
                ? BigDecimal.ZERO
                : v0.add(vin).divide(BigDecimal.valueOf(q1), 4, RoundingMode.HALF_UP);
        
        return new WacState(q1, avg1);
    }

    /**
     * Issues (consumes) inventory at current WAC.
     *
     * <p>WAC remains unchanged, only quantity is reduced.
     * Quantity is clamped to zero if issue exceeds available stock.
     *
     * @param st current state
     * @param qtyOut quantity being issued (positive)
     * @return issue result with updated state and cost
     */
    private static WacIssue issueAt(WacState st, int qtyOut) {
        long q0 = (st == null) ? 0 : st.qty();
        BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
        
        long q1 = Math.max(0, q0 - qtyOut);  // Guard against negative
        BigDecimal cost = c0.multiply(BigDecimal.valueOf(qtyOut));
        
        return new WacIssue(new WacState(q1, c0), cost);
    }
}
