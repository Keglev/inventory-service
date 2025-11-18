package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Query operation tests for {@link StockAnalyticsService}.
 * 
 * <p><strong>Purpose</strong></p>
 * Verify that analytics queries correctly map repository results to DTOs,
 * delegate to repositories with proper parameters, and handle various data types.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>Daily stock valuation (getTotalStockValueOverTime) - Date and BigDecimal mapping</li>
 *   <li>Stock per supplier aggregation (getTotalStockPerSupplier) - Supplier name and quantity mapping</li>
 *   <li>Item update frequency by supplier - DTO mapping and repository delegation</li>
 *   <li>Low stock items for supplier - Row unpacking to LowStockItemDTO</li>
 *   <li>Monthly stock movements - Object array to MonthlyStockMovementDTO conversion</li>
 *   <li>Filtered stock updates - Complex row unpacking with nulls and whitespace normalization</li>
 *   <li>Price trends - Direct DTO delegation with date conversion</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Mockito-only unit tests: no Spring context, no DB required</li>
 *   <li>Focus on DTO mapping logic and parameter passing to repository</li>
 *   <li>Handles mixed numeric types (Integer, Long, BigDecimal) in repository results</li>
 *   <li>Null handling and whitespace normalization verified where applicable</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplQueryTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    @Test
    void getTotalStockValueOverTime_mapsDateAndNumber() {
        // Setup date range for valuation query
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end = LocalDate.parse("2024-02-03");

        // Create mock repository result rows: [Date, total_value BigDecimal]
        List<Object[]> rows = Arrays.asList(
                new Object[]{Date.valueOf("2024-02-01"), new BigDecimal("10.50")},  // Feb 1: value 10.50
                new Object[]{Date.valueOf("2024-02-02"), new BigDecimal("12.00")}   // Feb 2: value 12.00
        );
        // Mock repository to return the valuation rows
        when(stockHistoryRepository.getDailyStockValuation(any(), any(), isNull())).thenReturn(rows);

        // Execute query for total stock value over time range
        List<StockValueOverTimeDTO> out = service.getTotalStockValueOverTime(start, end, null);

        // Verify DTO mapping: size, date conversion, value parsing
        assertEquals(2, out.size());
        assertEquals(LocalDate.parse("2024-02-01"), out.get(0).getDate());
        assertEquals(10.50, out.get(0).getTotalValue(), 1e-9);  // verify double precision value
    }

    @Test
    void getTotalStockPerSupplier_mapsQuantities() {
        // Create mock repository result rows: [supplier_name, total_qty (mixed types)]
        List<Object[]> rows = Arrays.asList(
                new Object[]{"Acme", new BigDecimal("42")},        // Acme: 42 units (BigDecimal)
                new Object[]{"Globex", 7}                           // Globex: 7 units (Integer)
        );
        // Mock repository to return supplier stock totals
        when(stockHistoryRepository.getTotalStockBySupplier()).thenReturn(rows);

        // Execute query for total stock per supplier
        List<StockPerSupplierDTO> out = service.getTotalStockPerSupplier();

        // Verify DTO mapping: supplier name and numeric conversion to long
        assertEquals(2, out.size());
        assertEquals("Acme", out.get(0).getSupplierName());
        assertEquals(42L, out.get(0).getTotalQuantity());  // BigDecimal converted to long
    }

    @Test
    void getItemUpdateFrequency_requiresSupplierId_andMaps() {
        // Create mock repository result rows: [item_name, update_count (mixed types)]
        List<Object[]> rows = Arrays.asList(
                new Object[]{"ItemA", new BigDecimal("5")},    // ItemA: 5 updates (BigDecimal)
                new Object[]{"ItemB", 2}                        // ItemB: 2 updates (Integer)
        );
        // Mock repository to return update frequency counts by item for supplier
        when(stockHistoryRepository.getUpdateCountByItem("S1")).thenReturn(rows);

        // Execute query for item update frequency in supplier S1
        List<ItemUpdateFrequencyDTO> out = service.getItemUpdateFrequency("S1");

        // Verify DTO mapping: item name and numeric conversion to long
        assertEquals(2, out.size());
        assertEquals("ItemA", out.get(0).getItemName());
        assertEquals(5L, out.get(0).getUpdateCount());  // BigDecimal converted to long
    }

    @Test
    void getItemsBelowMinimumStock_requiresSupplierId_andMaps() {
        // Create mock repository result rows: [item_name, quantity, minimum_quantity (mixed types)]
        List<Object[]> rows = Arrays.asList(
                new Object[]{"ItemA", 3, 5},                                    // ItemA: qty=3, min=5
                new Object[]{"ItemB", new BigDecimal("1"), new BigDecimal("2")} // ItemB: qty=1, min=2 (BigDecimal)
        );
        // Mock inventory repository to return items below minimum stock for supplier
        when(inventoryItemRepository.findItemsBelowMinimumStockFiltered("S1")).thenReturn(rows);

        // Execute query for items below minimum quantity in supplier S1
        List<LowStockItemDTO> out = service.getItemsBelowMinimumStock("S1");

        // Verify DTO mapping: item name and numeric conversions
        assertEquals(2, out.size());
        assertEquals("ItemA", out.get(0).getItemName());
        assertEquals(3, out.get(0).getQuantity());            // current quantity
        assertEquals(5, out.get(0).getMinimumQuantity());     // minimum threshold
    }

    @Test
    void getMonthlyStockMovement_mapsNumbers() {
        // Setup date range for monthly aggregation
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end = LocalDate.parse("2024-03-31");

        // Create mock repository result rows: [YYYY-MM, stock_in (mixed types), stock_out]
        List<Object[]> rows = Arrays.asList(
                new Object[]{"2024-02", new BigDecimal("5"), 2},      // Feb: 5 in, 2 out
                new Object[]{"2024-03", 7, new BigDecimal("4")}       // Mar: 7 in, 4 out (mixed types)
        );
        // Mock repository to return monthly aggregates by supplier
        when(stockHistoryRepository.getMonthlyStockMovementBySupplier(any(), any(), isNull())).thenReturn(rows);

        // Execute query for monthly stock movements in date window
        List<MonthlyStockMovementDTO> out = service.getMonthlyStockMovement(start, end, null);

        // Verify DTO mapping: month string and numeric conversions to long
        assertEquals(2, out.size());
        assertEquals("2024-02", out.get(0).getMonth());
        assertEquals(5L, out.get(0).getStockIn());   // BigDecimal converted to long
        assertEquals(2L, out.get(0).getStockOut());  // Integer converted to long
    }

    @Test
    void getFilteredStockUpdates_mapsRowShape() {
        // Setup date range for filtered updates
        LocalDateTime start = LocalDateTime.of(2024, 2, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2024, 2, 28, 23, 59);
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2024, 2, 10, 12, 0));

        // Create mock repository result row: [item_name, supplier_name, qty_change, reason, created_by, timestamp]
        List<Object[]> rows = Collections.singletonList(
                new Object[]{"ItemA", "SuppA", 5, "SOLD", "alice", ts}  // sale of 5 units on Feb 10
        );
        // Mock repository to return filtered stock update records
        when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any())).thenReturn(rows);

        // Create filter criteria for stock updates
        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(start);
        filter.setEndDate(end);
        filter.setItemName("Item");
        filter.setSupplierId("S1");
        filter.setCreatedBy("Alice");
        filter.setMinChange(1);
        filter.setMaxChange(10);

        // Execute filtered query with all criteria
        List<StockUpdateResultDTO> out = service.getFilteredStockUpdates(filter);

        // Verify DTO mapping: all fields correctly extracted and converted
        assertEquals(1, out.size());
        StockUpdateResultDTO r = out.get(0);
        assertEquals("ItemA", r.getItemName());
        assertEquals("SuppA", r.getSupplierName());
        assertEquals(5, r.getChange());              // quantity change
        assertEquals("SOLD", r.getReason());         // stock change reason
        assertEquals("alice", r.getCreatedBy());     // who made the change
        assertEquals(ts.toLocalDateTime(), r.getTimestamp());  // when change occurred
    }

    @Test
    void getFilteredStockUpdates_normalizesBlanksToNulls() {
        // Mock repository to return empty results (no matching updates)
        when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        // Create filter with blank/empty string values (should be normalized to null)
        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setItemName("   ");       // whitespace-only (should become null)
        filter.setSupplierId(" ");       // single space (should become null)
        filter.setCreatedBy("");         // empty string (should become null)

        // Execute filtered query with blank criteria
        service.getFilteredStockUpdates(filter);

        // Capture what was passed to repository (verify normalization)
        ArgumentCaptor<String> item = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> supp = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> who = ArgumentCaptor.forClass(String.class);

        // Verify repository called with null values instead of blanks
        verify(stockHistoryRepository).searchStockUpdates(
                any(), any(), item.capture(), supp.capture(), who.capture(), isNull(), isNull());

        // Assert normalization occurred: blanks converted to null
        assertEquals(null, item.getValue());     // "   " → null
        assertEquals(null, supp.getValue());     // " " → null
        assertEquals(null, who.getValue());      // "" → null
    }

    @Test
    void getPriceTrend_delegates() {
        // Setup date range for price trend analysis
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end = LocalDate.parse("2024-02-03");

        // Create expected DTO results from repository
        List<PriceTrendDTO> expected = Arrays.asList(
                new PriceTrendDTO("2024-02-01", new BigDecimal("4.25")),  // Feb 1: price 4.25
                new PriceTrendDTO("2024-02-02", new BigDecimal("4.40"))   // Feb 2: price 4.40
        );
        // Mock repository to return price trend DTOs directly
        when(stockHistoryRepository.getItemPriceTrend(eq("I1"), eq("S1"),
                any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(expected);

        // Execute query for price trend of item I1 for supplier S1 in date range
        List<PriceTrendDTO> out = service.getPriceTrend("I1", "S1", start, end);

        // Verify delegation: results match mock expectation
        assertEquals(expected, out);
        // Verify repository was called with correct parameters
        verify(stockHistoryRepository).getItemPriceTrend(eq("I1"), eq("S1"),
                any(LocalDateTime.class), any(LocalDateTime.class));
    }
}
