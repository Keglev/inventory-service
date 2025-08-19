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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.repository.custom.StockHistoryCustomRepository;

/**
 * Unit tests for {@link AnalyticsServiceImpl}.
 *
 * <p><strong>Scope:</strong> input validation, defaulting, and mapping of repository
 * projections to DTOs. Repository calls are mocked; SQL and controller concerns
 * are intentionally out of scope.</p>
 *
 * <p><strong>Out of scope:</strong> WAC/financial summary algorithm (covered in a
 * dedicated test class), web layer, and persistence-layer behavior.</p>
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;

    /** Required by the service constructor; unused in these tests. */
    @SuppressWarnings("unused")
    @Mock private StockHistoryCustomRepository stockHistoryCustomRepository;

    @InjectMocks private AnalyticsServiceImpl service;

    // ---------------------------------------------------------------------
    // Stock value over time
    // ---------------------------------------------------------------------

    /**
     * Maps daily stock value rows where the first column is a DATE and the second is a numeric total.
     */
    @Test
    void getTotalStockValueOverTime_mapsDateAndNumber() {
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end   = LocalDate.parse("2024-02-03");

        List<Object[]> rows = Arrays.asList(
            new Object[]{ Date.valueOf("2024-02-01"), new BigDecimal("10.50") },
            new Object[]{ Date.valueOf("2024-02-02"), new BigDecimal("12.00") }
        );
        when(stockHistoryRepository.getStockValueGroupedByDateFiltered(any(), any(), isNull()))
            .thenReturn(rows);

        List<StockValueOverTimeDTO> out = service.getTotalStockValueOverTime(start, end, null);

        assertEquals(2, out.size());
        assertEquals(LocalDate.parse("2024-02-01"), out.get(0).getDate());
        assertEquals(10.50, out.get(0).getTotalValue(), 1e-9);
        assertEquals(LocalDate.parse("2024-02-02"), out.get(1).getDate());
        assertEquals(12.00, out.get(1).getTotalValue(), 1e-9);

        verify(stockHistoryRepository).getStockValueGroupedByDateFiltered(any(), any(), isNull());
    }

    // ---------------------------------------------------------------------
    // Stock per supplier
    // ---------------------------------------------------------------------

    /** Verifies supplier totals are unboxed to long regardless of underlying numeric type. */
    @Test
    void getTotalStockPerSupplier_mapsQuantities() {
        List<Object[]> rows = Arrays.asList(
            new Object[]{ "Acme", new BigDecimal("42") },
            new Object[]{ "Globex", 7 }
        );
        when(stockHistoryRepository.getTotalStockPerSupplier()).thenReturn(rows);

        List<StockPerSupplierDTO> out = service.getTotalStockPerSupplier();

        assertEquals(2, out.size());
        assertEquals("Acme", out.get(0).getSupplierName());
        assertEquals(42L, out.get(0).getTotalQuantity());
        assertEquals("Globex", out.get(1).getSupplierName());
        assertEquals(7L, out.get(1).getTotalQuantity());
    }

    // ---------------------------------------------------------------------
    // Item update frequency
    // ---------------------------------------------------------------------

    /** Requires non-blank supplierId; maps [itemName, updateCount]. */
    @Test
    void getItemUpdateFrequency_requiresSupplierId_andMaps() {
        List<Object[]> rows = Arrays.asList(
            new Object[]{ "ItemA", new BigDecimal("5") },
            new Object[]{ "ItemB", 2 }
        );
        when(stockHistoryRepository.getUpdateCountPerItemFiltered("S1")).thenReturn(rows);

        List<ItemUpdateFrequencyDTO> out = service.getItemUpdateFrequency("S1");

        assertEquals(2, out.size());
        assertEquals("ItemA", out.get(0).getItemName());
        assertEquals(5L, out.get(0).getUpdateCount());
        assertEquals("ItemB", out.get(1).getItemName());
        assertEquals(2L, out.get(1).getUpdateCount());
    }

    /** Blank supplierId must trigger InvalidRequestException. */
    @Test
    void getItemUpdateFrequency_blankSupplier_throws() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getItemUpdateFrequency("  "));
        assertNotNull(ex.getMessage());
    }

    // ---------------------------------------------------------------------
    // Low stock items
    // ---------------------------------------------------------------------

    /** Requires non-blank supplierId; maps [name, quantity, minimum_quantity]. */
    @Test
    void getItemsBelowMinimumStock_requiresSupplierId_andMaps() {
        List<Object[]> rows = Arrays.asList(
            new Object[]{ "ItemA", 3, 5 },
            new Object[]{ "ItemB", new BigDecimal("1"), new BigDecimal("2") }
        );
        when(inventoryItemRepository.findItemsBelowMinimumStockFiltered("S1")).thenReturn(rows);

        List<LowStockItemDTO> out = service.getItemsBelowMinimumStock("S1");

        assertEquals(2, out.size());
        assertEquals("ItemA", out.get(0).getItemName());
        assertEquals(3, out.get(0).getQuantity());
        assertEquals(5, out.get(0).getMinimumQuantity());
        assertEquals("ItemB", out.get(1).getItemName());
        assertEquals(1, out.get(1).getQuantity());
        assertEquals(2, out.get(1).getMinimumQuantity());
    }

    /** Blank supplierId must trigger InvalidRequestException. */
    @Test
    void getItemsBelowMinimumStock_blankSupplier_throws() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getItemsBelowMinimumStock(""));
        assertNotNull(ex.getMessage());
    }

    // ---------------------------------------------------------------------
    // Monthly stock movement
    // ---------------------------------------------------------------------

    /** Accepts mixed numeric types for in/out totals and maps to long. */
    @Test
    void getMonthlyStockMovement_mapsNumbers() {
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end   = LocalDate.parse("2024-03-31");

        List<Object[]> rows = Arrays.asList(
            new Object[]{ "2024-02", new BigDecimal("5"), 2 },
            new Object[]{ "2024-03", 7, new BigDecimal("4") }
        );
        when(stockHistoryRepository.getMonthlyStockMovementFiltered(any(), any(), isNull()))
            .thenReturn(rows);

        List<MonthlyStockMovementDTO> out = service.getMonthlyStockMovement(start, end, null);

        assertEquals(2, out.size());
        assertEquals("2024-02", out.get(0).getMonth());
        assertEquals(5L, out.get(0).getStockIn());
        assertEquals(2L, out.get(0).getStockOut());
        assertEquals("2024-03", out.get(1).getMonth());
        assertEquals(7L, out.get(1).getStockIn());
        assertEquals(4L, out.get(1).getStockOut());
    }

    // ---------------------------------------------------------------------
    // Filtered stock updates
    // ---------------------------------------------------------------------

    /**
     * Verifies shape mapping for rows:
     * [itemName, supplierName, qtyChange, reason, createdBy, createdAt(Timestamp)].
     */
    @Test
    void getFilteredStockUpdates_mapsRowShape() {
        LocalDateTime start = LocalDateTime.of(2024, 2, 1, 0, 0);
        LocalDateTime end   = LocalDateTime.of(2024, 2, 28, 23, 59);
        Timestamp ts        = Timestamp.valueOf(LocalDateTime.of(2024, 2, 10, 12, 0));

         // Used singletonList to avoid varargs flattening
        List<Object[]> rows = java.util.Collections.singletonList(
            new Object[]{ "ItemA", "SuppA", 5, "SOLD", "alice", ts }
        );
        when(stockHistoryRepository.findFilteredStockUpdates(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(rows);

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(start);
        filter.setEndDate(end);
        filter.setItemName("Item");
        filter.setSupplierId("S1");
        filter.setCreatedBy("Alice");
        filter.setMinChange(1);
        filter.setMaxChange(10);

        List<StockUpdateResultDTO> out = service.getFilteredStockUpdates(filter);

        assertEquals(1, out.size());
        StockUpdateResultDTO r = out.get(0);
        assertEquals("ItemA", r.getItemName());
        assertEquals("SuppA", r.getSupplierName());
        assertEquals(5, r.getChange());       // <-- correct accessor
        assertEquals("SOLD", r.getReason());
        assertEquals("alice", r.getCreatedBy());
        assertEquals(ts.toLocalDateTime(), r.getTimestamp()); // <-- correct accessor
    }

    /** Blank text filters are normalized to null before repository invocation. */
    @Test
    void getFilteredStockUpdates_normalizesBlanksToNulls() {
        when(stockHistoryRepository.findFilteredStockUpdates(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Collections.emptyList());

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(null);
        filter.setEndDate(null);
        filter.setItemName("   ");   // blank
        filter.setSupplierId(" ");   // blank
        filter.setCreatedBy("");     // blank

        service.getFilteredStockUpdates(filter);

        ArgumentCaptor<String> item = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> supp = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> who  = ArgumentCaptor.forClass(String.class);

        verify(stockHistoryRepository).findFilteredStockUpdates(
                any(), any(), item.capture(), supp.capture(), who.capture(), isNull(), isNull());

        assertNull(item.getValue());
        assertNull(supp.getValue());
        assertNull(who.getValue());
    }

    /** start > end must trigger InvalidRequestException. */
    @Test
    void getFilteredStockUpdates_rejectsInvalidRange() {
        StockUpdateFilterDTO f = new StockUpdateFilterDTO();
        f.setStartDate(LocalDateTime.of(2024, 2, 10, 0, 0));
        f.setEndDate(LocalDateTime.of(2024, 2, 1, 0, 0));

        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(f));
        assertNotNull(ex.getMessage());
    }

    /** minChange > maxChange must trigger InvalidRequestException. */
    @Test
    void getFilteredStockUpdates_rejectsMinGreaterThanMax() {
        StockUpdateFilterDTO f = new StockUpdateFilterDTO();
        f.setStartDate(LocalDateTime.of(2024, 2, 1, 0, 0));
        f.setEndDate(LocalDateTime.of(2024, 2, 2, 0, 0));
        f.setMinChange(10);
        f.setMaxChange(5);

        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(f));
        assertNotNull(ex.getMessage());
    }

    /** null filter must trigger InvalidRequestException. */
    @Test
    void getFilteredStockUpdates_nullFilter_throwsInvalidRequest() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(null));
        assertNotNull(ex.getMessage());
    }

    // ---------------------------------------------------------------------
    // Price trend
    // ---------------------------------------------------------------------

    /** Delegates to repository and validates date inputs. */
    @Test
    void getPriceTrend_delegates() {
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end   = LocalDate.parse("2024-02-03");

        List<PriceTrendDTO> expected = Arrays.asList(
            new PriceTrendDTO("2024-02-01", new BigDecimal("4.25")),
            new PriceTrendDTO("2024-02-02", new BigDecimal("4.40"))
        );
        when(stockHistoryRepository.getPriceTrend(eq("I1"), eq("S1"),
                any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(expected);

        List<PriceTrendDTO> out = service.getPriceTrend("I1", "S1", start, end);

        assertEquals(expected, out);
        verify(stockHistoryRepository).getPriceTrend(eq("I1"), eq("S1"),
                any(LocalDateTime.class), any(LocalDateTime.class));
    }

    /** start > end must trigger InvalidRequestException. */
    @Test
    void getPriceTrend_invalidRange_throws() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class,
                () -> service.getPriceTrend("I1", "S1",
                        LocalDate.parse("2024-02-10"),
                        LocalDate.parse("2024-02-01")));
        assertNotNull(ex.getMessage());
    }

    /** blank itemId must trigger InvalidRequestException. */
    @Test
    void getPriceTrend_blankItem_throws() {
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class,
                () -> service.getPriceTrend("  ", null,
                        LocalDate.parse("2024-02-01"),
                        LocalDate.parse("2024-02-02")));
        assertNotNull(ex.getMessage());
    }
}
