package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
 * Service implementation for inventory analytics, reporting, and financial calculations.
 *
 * <p><strong>Characteristics</strong>:
 * <ul>
 *   <li><strong>Read-Only Operations</strong>: All methods marked {@code @Transactional(readOnly = true)}</li>
 *   <li><strong>WAC Calculation</strong>: Event replay algorithm for Weighted Average Cost reporting</li>
 *   <li><strong>Data Aggregation</strong>: Custom repository queries (native SQL/JPQL) for efficiency</li>
 *   <li><strong>Database Portability</strong>: Handles H2 (test) and Oracle (prod) type differences</li>
 *   <li><strong>Date Window Defaults</strong>: Last 30 days when bounds not specified</li>
 *   <li><strong>Input Validation</strong>: Date range checks, filter normalization</li>
 * </ul>
 *
 * <p><strong>Core Analytics</strong>:
 * <ul>
 *   <li>Stock valuation over time (daily trends, supplier filtering)</li>
 *   <li>Supplier performance metrics (stock distribution, update frequencies)</li>
 *   <li>Low stock alerts (threshold-based warnings)</li>
 *   <li>Movement trends (monthly stock-in/stock-out)</li>
 *   <li>Price history (procurement analysis)</li>
 *   <li>Financial summaries (WAC-based: opening, purchases, COGS, write-offs, ending)</li>
 * </ul>
 *
 * <p><strong>Transaction Management</strong>:
 * Class-level {@code @Transactional(readOnly = true)} for all analytics operations.
 *
 * <p><strong>Architecture Documentation</strong>:
 * For detailed operation flows, WAC algorithm, business rules, and refactoring notes, see:
 * <a href="../../../../../../docs/architecture/services/analytics-service.md">Analytics Service Architecture</a>
 *
 * @see AnalyticsService
 * @see com.smartsupplypro.inventory.repository.StockHistoryRepository
 * @see com.smartsupplypro.inventory.repository.InventoryItemRepository
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /**
     * Retrieves daily inventory value (quantity × price) over a date range.
     *
     * <p>Defaults to last 30 days if bounds are {@code null}.
     *
     * @param startDate inclusive start date (nullable)
     * @param endDate inclusive end date (nullable)
     * @param supplierId optional supplier filter ({@code null/blank} = all suppliers)
     * @return ordered list of daily stock values (ascending by date)
     * @throws InvalidRequestException if {@code startDate > endDate}
     * @see <a href="../../../../../../docs/architecture/services/analytics-service.md#stock-valuation">Stock Valuation</a>
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

        return rows.stream()
                .map(r -> new StockValueOverTimeDTO(
                        asLocalDate(r[0]),
                        asNumber(r[1]).doubleValue()
                ))
                .toList();
    }

    /**
     * Retrieves current stock quantities grouped by supplier.
     *
     * @return list of suppliers with total quantities (ordered by quantity desc)
     * @see <a href="../../../../../../docs/architecture/services/analytics-service.md#supplier-analytics">Supplier Analytics</a>
     */
    @Override
    public List<StockPerSupplierDTO> getTotalStockPerSupplier() {
        List<Object[]> rows = stockHistoryRepository.getTotalStockPerSupplier();

        return rows.stream()
                .map(r -> new StockPerSupplierDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue()
                ))
                .toList();
    }

    /**
     * Retrieves stock update frequency per item for a supplier.
     *
     * <p>Counts stock history entries per item (higher count = more active product).
     *
     * @param supplierId supplier identifier (required)
     * @return list of items with update counts (ordered by count desc)
     * @throws InvalidRequestException if {@code supplierId} is blank
     * @see <a href="../../../../../../docs/architecture/services/analytics-service.md#supplier-analytics">Supplier Analytics</a>
     */
    @Override
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId) {
        String sid = requireNonBlank(supplierId, "supplierId");

        List<Object[]> rows = stockHistoryRepository.getUpdateCountPerItemFiltered(sid);

        return rows.stream()
                .map(r -> new ItemUpdateFrequencyDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue()
                ))
                .toList();
    }

    /**
     * Identifies items below minimum stock threshold for a supplier.
     *
     * <p><strong>Business Rule</strong>: Low stock when {@code currentQuantity < minimumQuantity}.
     *
     * @param supplierId supplier identifier (required)
     * @return list of low-stock items (ordered by quantity asc, most critical first)
     * @throws InvalidRequestException if {@code supplierId} is blank
     * @see <a href="../../../../../../docs/architecture/services/analytics-service.md#low-stock-alerts">Low Stock Alerts</a>
     */
    @Override
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
     *
     * <p>Defaults to last 30 days if bounds are {@code null}.
     *
     * @param startDate inclusive start date (nullable)
     * @param endDate inclusive end date (nullable)
     * @param supplierId optional supplier filter ({@code null/blank} = all suppliers)
     * @return list of monthly movements (YYYY-MM format, ordered by month asc)
     * @throws InvalidRequestException if {@code startDate > endDate}
     * @see <a href="../../../../../../docs/architecture/services/analytics-service.md#movement-trends">Movement Trends</a>
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

        return rows.stream()
                .map(r -> new MonthlyStockMovementDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue(),
                        asNumber(r[2]).longValue()
                ))
                .toList();
    }

    /**
     * Total number of items currently below their configured minimum stock.
     */
    @Override
    @Transactional(readOnly = true)
    public long lowStockCount() {
        // global KPI → no supplier filter
        return inventoryItemRepository.countWithQuantityBelow(5);
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
        // === Input Validation ===
        if (from == null || to == null) throw new InvalidRequestException("from/to must be provided");
        if (from.isAfter(to)) throw new InvalidRequestException("from must be on or before to");

        // Convert LocalDate to LocalDateTime boundaries (inclusive range)
        LocalDateTime start = LocalDateTime.of(from, LocalTime.MIN);  // 00:00:00.000
        LocalDateTime end   = LocalDateTime.of(to,   LocalTime.MAX);  // 23:59:59.999

        // === Fetch Event Stream ===
        // Retrieve ALL stock history events up to 'end' date, ordered by item then timestamp.
        // This includes events before 'start' (needed for opening inventory calculation).
        var events = stockHistoryRepository.findEventsUpTo(end, blankToNull(supplierId));

        // === Initialize Financial Buckets ===
        // These accumulate the quantities and costs for each financial category.
        // All costs are calculated using WAC (Weighted Average Cost) at the time of movement.
        long openingQty = 0, purchasesQty = 0, returnsInQty = 0, cogsQty = 0, writeOffQty = 0, endingQty = 0;
        BigDecimal openingValue = BigDecimal.ZERO,    // Opening inventory value (qty × WAC)
                   purchasesCost = BigDecimal.ZERO,   // Total purchase cost in period
                   returnsInCost = BigDecimal.ZERO,   // Value of customer returns
                   cogsCost = BigDecimal.ZERO,        // Cost of Goods Sold (items sold at WAC)
                   writeOffCost = BigDecimal.ZERO,    // Cost of damaged/lost/expired items
                   endingValue = BigDecimal.ZERO;     // Ending inventory value (qty × WAC)

        // === Per-Item State Tracking ===
        // Map: itemId -> State(quantity, averageCost)
        // This tracks the running WAC and quantity for each inventory item as we replay events.
        Map<String, State> state = new HashMap<>();

        // === Define Reason Categories ===
        // Group StockChangeReasons into financial buckets for proper categorization.
        final Set<StockChangeReason> RETURNS_IN = Set.of(StockChangeReason.RETURNED_BY_CUSTOMER);
        final Set<StockChangeReason> WRITE_OFFS = Set.of(
                StockChangeReason.DAMAGED, StockChangeReason.DESTROYED,
                StockChangeReason.SCRAPPED, StockChangeReason.EXPIRED, StockChangeReason.LOST
        );
        final Set<StockChangeReason> RETURN_TO_SUPPLIER = Set.of(StockChangeReason.RETURNED_TO_SUPPLIER);

        // ==================================================================================
        // PHASE 1: Calculate Opening Inventory (events BEFORE the reporting period)
        // ==================================================================================
        // Replay all events that occurred before 'start' date to establish the opening
        // inventory quantity and WAC for each item. This gives us the baseline state
        // at the beginning of the reporting period.
        
        for (var e : events) {
            // Only process events strictly before the reporting period start
            if (e.createdAt().isBefore(start)) {
                State st = state.get(e.itemId());
                
                // --- Handle INBOUND events (positive quantity changes) ---
                if (e.quantityChange() > 0) {
                    // Determine unit cost for this inbound event:
                    // 1. Use priceAtChange if available (recorded at transaction time)
                    // 2. Otherwise, use current WAC for this item (maintains cost continuity)
                    // 3. If no prior state, default to zero (prevents null errors)
                    BigDecimal unit = (e.priceAtChange() != null)
                            ? e.priceAtChange()
                            : (st == null ? BigDecimal.ZERO : st.avgCost());
                    
                    // Apply inbound: Updates quantity and recalculates WAC
                    // Formula: newWAC = (oldQty × oldWAC + inboundQty × unitCost) / newQty
                    st = applyInbound(st, e.quantityChange(), unit);
                    state.put(e.itemId(), st);
                    
                // --- Handle OUTBOUND events (negative quantity changes) ---
                } else if (e.quantityChange() < 0) {
                    // Issue (consume) quantity at current WAC
                    // This reduces quantity but maintains the same WAC for remaining stock
                    Issue iss = issueAt(st, Math.abs(e.quantityChange()));
                    state.put(e.itemId(), iss.state());
                }
                // Note: quantityChange == 0 (price-only changes) don't affect opening inventory
            }
        }
        
        // Sum up opening inventory across all items
        // This represents the total quantity and value on hand at the start of the period
        for (var st : state.values()) {
            openingQty += st.qty();
            openingValue = openingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }

        // ==================================================================================
        // PHASE 2: Process Events Within Reporting Period [start..end]
        // ==================================================================================
        // Process all events that fall within the reporting period, categorizing them into
        // financial buckets (Purchases, Returns, COGS, Write-offs) while maintaining
        // the running WAC state for each item.
        
        for (var e : events) {
            // Skip events before the reporting period (already processed in Phase 1)
            if (e.createdAt().isBefore(start)) continue;

            State st = state.get(e.itemId());

            // ====================================================================
            // Handle POSITIVE Quantity Changes (Inbound / Stock-In)
            // ====================================================================
            if (e.quantityChange() > 0) {
                // Determine unit cost for this inbound event
                BigDecimal unit = (e.priceAtChange() != null)
                        ? e.priceAtChange()
                        : (st == null ? BigDecimal.ZERO : st.avgCost());
                
                // Update state: Add quantity and recalculate WAC
                State newSt = applyInbound(st, e.quantityChange(), unit);
                state.put(e.itemId(), newSt);

                // --- Categorize into Financial Buckets ---
                
                if (RETURNS_IN.contains(e.reason())) {
                    // Customer returned items → separate bucket from purchases
                    returnsInQty += e.quantityChange();
                    returnsInCost = returnsInCost.add(unit.multiply(BigDecimal.valueOf(e.quantityChange())));
                    
                } else {
                    // Purchases or Initial Stock
                    // Only count as "purchase" if:
                    // 1. Has a price recorded (priceAtChange != null), OR
                    // 2. Is marked as INITIAL_STOCK
                    if (e.priceAtChange() != null || e.reason() == StockChangeReason.INITIAL_STOCK) {
                        purchasesQty += e.quantityChange();
                        purchasesCost = purchasesCost.add(unit.multiply(BigDecimal.valueOf(e.quantityChange())));
                    }
                    // Note: Positive manual adjustments without price still update WAC/quantity
                    // but don't count as "purchases" for financial reporting purposes
                }

            // ====================================================================
            // Handle NEGATIVE Quantity Changes (Outbound / Stock-Out)
            // ====================================================================
            } else if (e.quantityChange() < 0) {
                int out = Math.abs(e.quantityChange());

                // --- Categorize by Reason ---
                
                if (RETURN_TO_SUPPLIER.contains(e.reason())) {
                    // Returning items to supplier → treat as NEGATIVE purchase
                    // This reduces both the purchases quantity and cost for the period
                    Issue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    
                    purchasesQty -= out;
                    purchasesCost = purchasesCost.subtract(iss.cost());  // Cost calculated at WAC

                } else if (WRITE_OFFS.contains(e.reason())) {
                    // Items damaged, lost, expired, destroyed, scrapped
                    // These are losses valued at current WAC
                    Issue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    
                    writeOffQty += out;
                    writeOffCost = writeOffCost.add(iss.cost());  // Cost calculated at WAC

                } else {
                    // Default bucket: COGS (Cost of Goods Sold)
                    // This includes: SOLD, MANUAL_UPDATE (if negative), and other consumptions
                    // Valued at current WAC
                    Issue iss = issueAt(st, out);
                    state.put(e.itemId(), iss.state());
                    
                    cogsQty += out;
                    cogsCost = cogsCost.add(iss.cost());  // Cost calculated at WAC
                }
            }
            // Note: quantityChange == 0 (price-only adjustments like PRICE_CHANGE reason)
            // don't affect quantities or financial buckets, but they update WAC state.
        }

        // ==================================================================================
        // PHASE 3: Calculate Ending Inventory
        // ==================================================================================
        // Sum the final state across all items after all events have been processed.
        // This represents the quantity and value on hand at the end of the reporting period.
        
        for (var st : state.values()) {
            endingQty += st.qty();
            endingValue = endingValue.add(st.avgCost().multiply(BigDecimal.valueOf(st.qty())));
        }

        // ==================================================================================
        // Build and Return Financial Summary DTO
        // ==================================================================================
        // Package all calculated metrics into a structured DTO for frontend consumption.
        // 
        // Financial Equation Check (should balance):
        // Opening Value + Purchases Cost + Returns In Cost - COGS Cost - Write-off Cost = Ending Value
        
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
    * Converts a date-like value to {@link LocalDate}.
    *
    * <p>Accepts:
    * <ul>
    *   <li>{@link LocalDate}</li>
    *   <li>{@link java.sql.Date} (converted via {@code toLocalDate()})</li>
    *   <li>{@link java.sql.Timestamp} (converted via {@code toLocalDateTime().toLocalDate()})</li>
    *   <li>{@link CharSequence} in formats starting with {@code yyyy-MM-dd}, e.g. {@code "2025-03-15 00:00:00.0"}</li>
    * </ul>
    * Falls back to parsing the first 10 characters as {@code yyyy-MM-dd} for vendor-specific projections.
    *
    * @param o raw value from native projections (DATE/TIMESTAMP/STRING)
    * @return the corresponding {@link LocalDate}
    * @throws IllegalStateException if the value cannot be interpreted as a date
    */
    private static LocalDate asLocalDate(Object o) {
        if (o instanceof LocalDate ld) return ld;

        if (o instanceof java.sql.Date d) return d.toLocalDate();

        if (o instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();

        if (o instanceof CharSequence cs) {
            String s = cs.toString();
            if (s.length() >= 10) {
            // e.g. "2025-03-15 00:00:00.0" → "2025-03-15"
            return LocalDate.parse(s.substring(0, 10));
            }
        }

        // Last resort: try toString().substring(0,10) if it looks like a timestamp literal
        String s = String.valueOf(o);
        if (s != null && s.length() >= 10 && s.charAt(4) == '-' && s.charAt(7) == '-') {
            return LocalDate.parse(s.substring(0, 10));
        }

        throw new IllegalStateException("Expected LocalDate/Date/ Timestamp/String but got: " +
                (o == null ? "null" : o.getClass().getName() + " -> " + o));
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
     * Accepts {@code null} (treated as zero), {@link Number}, and {@link BigDecimal}.
    */
    private static Number asNumber(Object o) {
        if (o == null) return java.math.BigDecimal.ZERO;
        if (o instanceof Number n) return n;
        if (o instanceof java.math.BigDecimal bd) return bd;
        throw new IllegalStateException("Expected numeric type but got: " + o);
    }

    // ==================================================================================
    // WAC (Weighted Average Cost) Algorithm - Core Data Structures
    // ==================================================================================
    
    /**
     * Represents the current inventory state for a single item.
     * <p>
     * This immutable record tracks two critical pieces of information:
     * <ul>
     *   <li><strong>qty</strong>: Current on-hand quantity</li>
     *   <li><strong>avgCost</strong>: Current Weighted Average Cost (WAC) per unit</li>
     * </ul>
     * </p>
     *
     * <p><strong>WAC Calculation</strong>: When new stock arrives at a different price,
     * the WAC is recalculated using the formula:
     * <pre>
     * newWAC = (oldQty × oldWAC + inboundQty × inboundPrice) / (oldQty + inboundQty)
     * </pre>
     * </p>
     *
     * @param qty the current on-hand quantity for this item
     * @param avgCost the current weighted average cost per unit
     */
    private record State(long qty, BigDecimal avgCost) {}

    /**
     * Represents the result of an outbound (issue/consumption) operation.
     * <p>
     * When items are consumed (sold, damaged, etc.), we need to track:
     * <ul>
     *   <li><strong>state</strong>: Updated inventory state after the issue (reduced quantity, same WAC)</li>
     *   <li><strong>cost</strong>: Total cost of the issued quantity at the current WAC</li>
     * </ul>
     * This cost value is used for COGS, write-off, or return-to-supplier calculations.
     * </p>
     *
     * @param state the updated State after issuing the quantity
     * @param cost the total cost of the issued quantity (qtyOut × currentWAC)
     */
    private record Issue(State state, BigDecimal cost) {}

    // ==================================================================================
    // WAC (Weighted Average Cost) Algorithm - Core Operations
    // ==================================================================================
    
    /**
     * Applies an inbound stock movement and recalculates the Weighted Average Cost.
     * <p>
     * This method implements the core WAC algorithm for purchasing/receiving inventory.
     * When new stock arrives at a different unit cost, the average cost is recalculated
     * to blend the old and new costs proportionally.
     * </p>
     *
     * <p><strong>Algorithm</strong>:</p>
     * <pre>
     * oldValue = oldQty × oldWAC
     * inboundValue = inboundQty × inboundUnitCost
     * newQty = oldQty + inboundQty
     * newWAC = (oldValue + inboundValue) / newQty
     * </pre>
     *
     * <p><strong>Example</strong>:</p>
     * <ul>
     *   <li>Current state: 100 units @ $10 WAC = $1,000 value</li>
     *   <li>Purchase: 50 units @ $12 per unit = $600 value</li>
     *   <li>New state: 150 units @ $10.67 WAC = $1,600 value</li>
     * </ul>
     *
     * <p><strong>Edge Cases</strong>:</p>
     * <ul>
     *   <li>If {@code st} is null, treats as first purchase (no existing inventory)</li>
     *   <li>If result quantity is zero, WAC defaults to zero</li>
     *   <li>Precision: 4 decimal places, HALF_UP rounding</li>
     * </ul>
     *
     * @param st current state (nullable for first purchase)
     * @param qtyIn quantity being added (must be positive)
     * @param unitCost unit cost of the inbound stock
     * @return new {@link State} with updated quantity and recalculated WAC
     */
    private static State applyInbound(State st, int qtyIn, BigDecimal unitCost) {
        // Extract current values (default to zero if no prior state)
        long q0 = (st == null) ? 0 : st.qty();
        BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
        
        // Calculate new quantity
        long q1 = q0 + qtyIn;
        
        // Calculate total values
        BigDecimal v0  = c0.multiply(BigDecimal.valueOf(q0));        // Existing inventory value
        BigDecimal vin = unitCost.multiply(BigDecimal.valueOf(qtyIn)); // Inbound inventory value
        
        // Calculate new WAC (weighted average of old and new)
        BigDecimal avg1 = (q1 == 0)
                ? BigDecimal.ZERO
                : v0.add(vin).divide(BigDecimal.valueOf(q1), 4, RoundingMode.HALF_UP);
        
        return new State(q1, avg1);
    }

    /**
     * Issues (consumes) inventory at the current Weighted Average Cost.
     * <p>
     * This method handles outbound stock movements (sales, consumption, write-offs, returns)
     * where items are removed from inventory at the current WAC. Unlike inbound operations,
     * issuing stock does NOT change the WAC - it only reduces quantity.
     * </p>
     *
     * <p><strong>Algorithm</strong>:</p>
     * <pre>
     * newQty = oldQty - qtyOut
     * cost = qtyOut × currentWAC
     * WAC remains unchanged
     * </pre>
     *
     * <p><strong>Example</strong>:</p>
     * <ul>
     *   <li>Current state: 150 units @ $10.67 WAC</li>
     *   <li>Issue: 50 units</li>
     *   <li>New state: 100 units @ $10.67 WAC (WAC unchanged)</li>
     *   <li>Cost of issue: 50 × $10.67 = $533.50</li>
     * </ul>
     *
     * <p><strong>Negative Quantity Guard</strong>: If the issue would result in negative
     * quantity (data integrity issue), the quantity is clamped to zero. This prevents
     * runtime errors but indicates a potential data problem that should be investigated.</p>
     *
     * @param st current state (nullable for safety, treated as zero quantity/cost)
     * @param qtyOut quantity being issued/consumed (must be positive)
     * @return {@link Issue} containing the updated state and the cost of issued quantity
     */
    private static Issue issueAt(State st, int qtyOut) {
        // Extract current values (default to zero if no prior state)
        long q0 = (st == null) ? 0 : st.qty();
        BigDecimal c0 = (st == null) ? BigDecimal.ZERO : st.avgCost();
        
        // Calculate new quantity (guard against negative)
        long q1 = q0 - qtyOut;
        if (q1 < 0) {
            // Data integrity issue: issuing more than available
            // Clamp to zero to prevent errors, but this indicates a problem
            q1 = 0;
        }
        
        // Calculate cost of the issue at current WAC
        BigDecimal cost = c0.multiply(BigDecimal.valueOf(qtyOut));
        
        // Return new state (reduced quantity, same WAC) and issue cost
        return new Issue(new State(q1, c0), cost);
    }

}
