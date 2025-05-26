package com.smartsupplypro.inventory.service.impl;

import com.smartsupplypro.inventory.dto.*;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Arrays;
import java.util.Collections;
import java.sql.Timestamp;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class AnalyticsServiceImplTest {

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private StockHistoryRepository stockHistoryRepository;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void shouldReturnTotalStockPerSupplier() {
        when(stockHistoryRepository.getTotalStockPerSupplier()).thenReturn(
            Arrays.<Object[]>asList(
                new Object[]{"Supplier A", BigDecimal.valueOf(100)}
            )
        );

        List<StockPerSupplierDTO> result = analyticsService.getTotalStockPerSupplier();

        assertEquals(1, result.size());
        assertEquals("Supplier A", result.get(0).getSupplierName());
    }

    @Test
    void shouldHandleEmptyStockPerSupplier() {
        when(stockHistoryRepository.getTotalStockPerSupplier()).thenReturn(Collections.emptyList());

        List<StockPerSupplierDTO> result = analyticsService.getTotalStockPerSupplier();

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldReturnLowStockItems() {
        when(inventoryItemRepository.findItemsBelowMinimumStockFiltered("s1"))
            .thenReturn(Arrays.<Object[]>asList(new Object[]{"Item X", BigDecimal.valueOf(5), BigDecimal.valueOf(10)}));

        List<LowStockItemDTO> result = analyticsService.getItemsBelowMinimumStock("s1");

        assertEquals(1, result.size());
        assertEquals("Item X", result.get(0).getItemName());
    }

    @Test
    void shouldReturnEmptyWhenSupplierIdIsInvalidForLowStock() {
        when(inventoryItemRepository.findItemsBelowMinimumStockFiltered("invalid"))
            .thenReturn(Collections.emptyList());

        List<LowStockItemDTO> result = analyticsService.getItemsBelowMinimumStock("invalid");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldHandleEmptyItemUpdateFrequency() {
        when(stockHistoryRepository.getUpdateCountPerItemFiltered("none"))
            .thenReturn(Collections.emptyList());

        List<ItemUpdateFrequencyDTO> result = analyticsService.getItemUpdateFrequency("none");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldHandleEmptyMonthlyStockMovement() {
        when(stockHistoryRepository.getMonthlyStockMovementFiltered(any(), any(), eq("bad")))
            .thenReturn(Collections.emptyList());

        List<MonthlyStockMovementDTO> result = analyticsService.getMonthlyStockMovement(
                LocalDate.now().minusMonths(2), LocalDate.now(), "bad");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldHandleEmptyFilteredStockUpdates() {
        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setItemName("Invalid Item");
        filter.setSupplierId("bad");
        filter.setStartDate(LocalDateTime.now().minusDays(5));
        filter.setEndDate(LocalDateTime.now());

        when(stockHistoryRepository.findFilteredStockUpdates(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Collections.emptyList());

        List<StockUpdateResultDTO> result = analyticsService.getFilteredStockUpdates(filter);

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldUseDefaultDatesIfMissingInStockUpdates() {
        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setItemName("ItemX");
        filter.setSupplierId("s1");

        List<Object[]> mockResult = Arrays.<Object[]>asList(new Object[]{
            "ItemX", "s1", BigDecimal.valueOf(5), "SALE", "admin", Timestamp.valueOf(LocalDateTime.now())
        });

        when(stockHistoryRepository.findFilteredStockUpdates(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(mockResult);

        List<StockUpdateResultDTO> result = analyticsService.getFilteredStockUpdates(filter);

        assertEquals(1, result.size());
        assertEquals("ItemX", result.get(0).getItemName());
    }

    @Test
    void shouldUseDefaultDatesIfMissingInStockMovement() {
        List<Object[]> mockResult = Arrays.<Object[]>asList(new Object[]{
            "2024-01", BigDecimal.valueOf(10), BigDecimal.valueOf(5)
        });

        when(stockHistoryRepository.getMonthlyStockMovementFiltered(any(), any(), any()))
            .thenReturn(mockResult);

        List<MonthlyStockMovementDTO> result = analyticsService.getMonthlyStockMovement(null, null, "s1");

        assertEquals(1, result.size());
        assertEquals("2024-01", result.get(0).getMonth());
    }
}