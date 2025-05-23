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
                new Object[]{"Supplier A", BigDecimal.valueOf(100)},
                new Object[]{"Supplier B", BigDecimal.valueOf(50)}
            )
        );

        List<StockPerSupplierDTO> result = analyticsService.getTotalStockPerSupplier();

        assertEquals(2, result.size());
        assertEquals("Supplier A", result.get(0).getSupplierName());
        assertEquals(100L, result.get(0).getTotalQuantity());
    }

    @Test
    void shouldReturnLowStockItems() {
        when(inventoryItemRepository.findItemsBelowMinimumStockFiltered("s1"))
            .thenReturn(
                Arrays.<Object[]>asList(
                    new Object[]{"Item X", BigDecimal.valueOf(5), BigDecimal.valueOf(10)}
                )
            );

        List<LowStockItemDTO> result = analyticsService.getItemsBelowMinimumStock("s1");

        assertEquals(1, result.size());
        assertEquals("Item X", result.get(0).getItemName());
        assertEquals(5, result.get(0).getQuantity());
        assertEquals(10, result.get(0).getMinimumQuantity());
    }

    @Test
    void shouldReturnItemUpdateFrequency() {
        when(stockHistoryRepository.getUpdateCountPerItemFiltered("s1"))
            .thenReturn(
                Arrays.<Object[]>asList(
                    new Object[]{"Item A", BigDecimal.valueOf(2)},
                    new Object[]{"Item B", BigDecimal.valueOf(1)}
                )
            );

        List<ItemUpdateFrequencyDTO> result = analyticsService.getItemUpdateFrequency("s1");

        assertEquals(2, result.size());
        assertEquals("Item A", result.get(0).getItemName());
        assertEquals(2L, result.get(0).getUpdateCount());
    }

    @Test
    void shouldReturnMonthlyStockMovement() {
        when(stockHistoryRepository.getMonthlyStockMovementFiltered(any(), any(), eq("s1")))
            .thenReturn(
                Arrays.<Object[]>asList(
                    new Object[]{"2024-01", BigDecimal.valueOf(10), BigDecimal.valueOf(5)}
                )
            );

        List<MonthlyStockMovementDTO> result = analyticsService.getMonthlyStockMovement(
                LocalDate.now().minusMonths(1), LocalDate.now(), "s1");

        assertEquals(1, result.size());
        assertEquals("2024-01", result.get(0).getMonth());
        assertEquals(10L, result.get(0).getStockIn());
        assertEquals(5L, result.get(0).getStockOut());
    }

    @Test
    void shouldReturnFilteredStockUpdates() {
        when(stockHistoryRepository.findFilteredStockUpdates(
            any(), any(), eq("Item A"), eq("Supplier A"), any(), any(), any())
        ).thenReturn(
            Arrays.<Object[]>asList(
                new Object[]{"Item A", "Supplier A", BigDecimal.valueOf(3), "SALE", "admin",
                        Timestamp.valueOf(LocalDateTime.now())}
            )
        );

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setItemName("Item A");
        filter.setSupplierId("Supplier A");
        filter.setStartDate(LocalDateTime.now().minusDays(5));
        filter.setEndDate(LocalDateTime.now());

        List<StockUpdateResultDTO> result = analyticsService.getFilteredStockUpdates(filter);

        assertEquals(1, result.size());
        assertEquals("Item A", result.get(0).getItemName());
        assertEquals("Supplier A", result.get(0).getSupplierName());
        assertEquals("SALE", result.get(0).getReason());
    }
}
