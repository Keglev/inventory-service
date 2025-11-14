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
 * Tests DTO mapping and repository delegation for analytics queries.
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplQueryTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    @Test
    void getTotalStockValueOverTime_mapsDateAndNumber() {
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end = LocalDate.parse("2024-02-03");

        List<Object[]> rows = Arrays.asList(
                new Object[]{Date.valueOf("2024-02-01"), new BigDecimal("10.50")},
                new Object[]{Date.valueOf("2024-02-02"), new BigDecimal("12.00")}
        );
        when(stockHistoryRepository.getDailyStockValuation(any(), any(), isNull())).thenReturn(rows);

        List<StockValueOverTimeDTO> out = service.getTotalStockValueOverTime(start, end, null);

        assertEquals(2, out.size());
        assertEquals(LocalDate.parse("2024-02-01"), out.get(0).getDate());
        assertEquals(10.50, out.get(0).getTotalValue(), 1e-9);
    }

    @Test
    void getTotalStockPerSupplier_mapsQuantities() {
        List<Object[]> rows = Arrays.asList(
                new Object[]{"Acme", new BigDecimal("42")},
                new Object[]{"Globex", 7}
        );
        when(stockHistoryRepository.getTotalStockBySupplier()).thenReturn(rows);

        List<StockPerSupplierDTO> out = service.getTotalStockPerSupplier();

        assertEquals(2, out.size());
        assertEquals("Acme", out.get(0).getSupplierName());
        assertEquals(42L, out.get(0).getTotalQuantity());
    }

    @Test
    void getItemUpdateFrequency_requiresSupplierId_andMaps() {
        List<Object[]> rows = Arrays.asList(
                new Object[]{"ItemA", new BigDecimal("5")},
                new Object[]{"ItemB", 2}
        );
        when(stockHistoryRepository.getUpdateCountByItem("S1")).thenReturn(rows);

        List<ItemUpdateFrequencyDTO> out = service.getItemUpdateFrequency("S1");

        assertEquals(2, out.size());
        assertEquals("ItemA", out.get(0).getItemName());
        assertEquals(5L, out.get(0).getUpdateCount());
    }

    @Test
    void getItemsBelowMinimumStock_requiresSupplierId_andMaps() {
        List<Object[]> rows = Arrays.asList(
                new Object[]{"ItemA", 3, 5},
                new Object[]{"ItemB", new BigDecimal("1"), new BigDecimal("2")}
        );
        when(inventoryItemRepository.findItemsBelowMinimumStockFiltered("S1")).thenReturn(rows);

        List<LowStockItemDTO> out = service.getItemsBelowMinimumStock("S1");

        assertEquals(2, out.size());
        assertEquals("ItemA", out.get(0).getItemName());
        assertEquals(3, out.get(0).getQuantity());
        assertEquals(5, out.get(0).getMinimumQuantity());
    }

    @Test
    void getMonthlyStockMovement_mapsNumbers() {
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end = LocalDate.parse("2024-03-31");

        List<Object[]> rows = Arrays.asList(
                new Object[]{"2024-02", new BigDecimal("5"), 2},
                new Object[]{"2024-03", 7, new BigDecimal("4")}
        );
        when(stockHistoryRepository.getMonthlyStockMovementBySupplier(any(), any(), isNull())).thenReturn(rows);

        List<MonthlyStockMovementDTO> out = service.getMonthlyStockMovement(start, end, null);

        assertEquals(2, out.size());
        assertEquals("2024-02", out.get(0).getMonth());
        assertEquals(5L, out.get(0).getStockIn());
        assertEquals(2L, out.get(0).getStockOut());
    }

    @Test
    void getFilteredStockUpdates_mapsRowShape() {
        LocalDateTime start = LocalDateTime.of(2024, 2, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2024, 2, 28, 23, 59);
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2024, 2, 10, 12, 0));

        List<Object[]> rows = Collections.singletonList(
                new Object[]{"ItemA", "SuppA", 5, "SOLD", "alice", ts}
        );
        when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any())).thenReturn(rows);

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
        assertEquals(5, r.getChange());
        assertEquals("SOLD", r.getReason());
        assertEquals("alice", r.getCreatedBy());
        assertEquals(ts.toLocalDateTime(), r.getTimestamp());
    }

    @Test
    void getFilteredStockUpdates_normalizesBlanksToNulls() {
        when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setItemName("   ");
        filter.setSupplierId(" ");
        filter.setCreatedBy("");

        service.getFilteredStockUpdates(filter);

        ArgumentCaptor<String> item = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> supp = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> who = ArgumentCaptor.forClass(String.class);

        verify(stockHistoryRepository).searchStockUpdates(
                any(), any(), item.capture(), supp.capture(), who.capture(), isNull(), isNull());

        assertEquals(null, item.getValue());
        assertEquals(null, supp.getValue());
        assertEquals(null, who.getValue());
    }

    @Test
    void getPriceTrend_delegates() {
        LocalDate start = LocalDate.parse("2024-02-01");
        LocalDate end = LocalDate.parse("2024-02-03");

        List<PriceTrendDTO> expected = Arrays.asList(
                new PriceTrendDTO("2024-02-01", new BigDecimal("4.25")),
                new PriceTrendDTO("2024-02-02", new BigDecimal("4.40"))
        );
        when(stockHistoryRepository.getItemPriceTrend(eq("I1"), eq("S1"),
                any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(expected);

        List<PriceTrendDTO> out = service.getPriceTrend("I1", "S1", start, end);

        assertEquals(expected, out);
        verify(stockHistoryRepository).getItemPriceTrend(eq("I1"), eq("S1"),
                any(LocalDateTime.class), any(LocalDateTime.class));
    }
}
