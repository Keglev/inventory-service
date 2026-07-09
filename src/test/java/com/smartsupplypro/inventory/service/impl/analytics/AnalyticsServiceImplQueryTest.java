package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Nested;
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

/**
 * Unit tests for {@link StockAnalyticsService} query methods — DTO mapping, repository delegation,
 * mixed numeric type coercion, and blank-to-null normalization.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplQueryTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    /**
     * Tests for {@code getTotalStockValueOverTime} and {@code getTotalStockPerSupplier}.
     */
    @Nested
    class AggregatedStockQueries {

        @Test
        void should_map_date_and_numeric_columns_to_dto() {
            when(stockHistoryRepository.getDailyStockValuation(any(), any(), isNull()))
                    .thenReturn(Arrays.asList(
                            new Object[]{Date.valueOf("2024-02-01"), new BigDecimal("10.50")},
                            new Object[]{Date.valueOf("2024-02-02"), new BigDecimal("12.00")}
                    ));

            List<StockValueOverTimeDTO> out = service.getTotalStockValueOverTime(
                    LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-03"), null);

            assertEquals(2, out.size());
            assertEquals(LocalDate.parse("2024-02-01"), out.get(0).date());
            assertEquals(10.50, out.get(0).totalValue(), 1e-9);
        }

        @Test
        void should_map_supplier_name_and_convert_mixed_numeric_types_to_long() {
            when(stockHistoryRepository.getTotalStockBySupplier())
                    .thenReturn(Arrays.asList(
                            new Object[]{"Acme",   new BigDecimal("42")},
                            new Object[]{"Globex", 7}
                    ));

            List<StockPerSupplierDTO> out = service.getTotalStockPerSupplier();

            assertEquals(2, out.size());
            assertEquals("Acme", out.get(0).supplierName());
            assertEquals(42L, out.get(0).totalQuantity());
        }
    }

    /**
     * Tests for {@code getItemUpdateFrequency} and {@code getItemsBelowMinimumStock}.
     */
    @Nested
    class SupplierScopedQueries {

        @Test
        void should_map_item_update_frequency_with_mixed_numeric_types() {
            when(stockHistoryRepository.getUpdateCountByItem("S1"))
                    .thenReturn(Arrays.asList(
                            new Object[]{"ItemA", new BigDecimal("5")},
                            new Object[]{"ItemB", 2}
                    ));

            List<ItemUpdateFrequencyDTO> out = service.getItemUpdateFrequency("S1");

            assertEquals(2, out.size());
            assertEquals("ItemA", out.get(0).itemName());
            assertEquals(5L, out.get(0).updateCount());
        }

        @Test
        void should_unpack_low_stock_items_with_mixed_numeric_types() {
            when(inventoryItemRepository.findItemsBelowMinimumStockFiltered("S1"))
                    .thenReturn(Arrays.asList(
                            new Object[]{"ItemA", 3,                    5},
                            new Object[]{"ItemB", new BigDecimal("1"),  new BigDecimal("2")}
                    ));

            List<LowStockItemDTO> out = service.getItemsBelowMinimumStock("S1");

            assertEquals(2, out.size());
            assertEquals("ItemA", out.get(0).itemName());
            assertEquals(3, out.get(0).quantity());
            assertEquals(5, out.get(0).minimumQuantity());
        }
    }

    /**
     * Tests for {@code getFilteredStockUpdates}.
     */
    @Nested
    class FilteredStockUpdates {

        @Test
        void should_map_all_result_row_fields_to_dto() {
            Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2024, 2, 10, 12, 0));
            when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(Collections.singletonList(
                            new Object[]{"ItemA", "SuppA", 5, "SOLD", "alice", ts}
                    ));

            StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
            filter.setStartDate(LocalDateTime.of(2024, 2, 1,  0, 0));
            filter.setEndDate(LocalDateTime.of(2024, 2, 28, 23, 59));
            filter.setItemName("Item"); filter.setSupplierId("S1");
            filter.setCreatedBy("Alice"); filter.setMinChange(1); filter.setMaxChange(10);

            List<StockUpdateResultDTO> out = service.getFilteredStockUpdates(filter);

            assertEquals(1, out.size());
            StockUpdateResultDTO r = out.get(0);
            assertEquals("ItemA", r.itemName());
            assertEquals("SuppA", r.supplierName());
            assertEquals(5, r.change());
            assertEquals("SOLD", r.reason());
            assertEquals("alice", r.createdBy());
            assertEquals(ts.toLocalDateTime(), r.timestamp());
        }

        @Test
        void should_normalize_blank_strings_to_null_before_passing_to_repository() {
            when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(Collections.emptyList());

            StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
            filter.setItemName("   "); filter.setSupplierId(" "); filter.setCreatedBy("");
            service.getFilteredStockUpdates(filter);

            ArgumentCaptor<String> item = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<String> supp = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<String> who  = ArgumentCaptor.forClass(String.class);
            verify(stockHistoryRepository).searchStockUpdates(
                    any(), any(), item.capture(), supp.capture(), who.capture(), isNull(), isNull());

            assertEquals(null, item.getValue());
            assertEquals(null, supp.getValue());
            assertEquals(null, who.getValue());
        }
    }

    /**
     * Tests for {@code getMonthlyStockMovement} and {@code getPriceTrend}.
     */
    @Nested
    class TimeSeriesQueries {

        @Test
        void should_map_month_and_convert_stock_in_and_out_to_long() {
            when(stockHistoryRepository.getMonthlyStockMovementBySupplier(any(), any(), isNull()))
                    .thenReturn(Arrays.asList(
                            new Object[]{"2024-02", new BigDecimal("5"), 2},
                            new Object[]{"2024-03", 7,                   new BigDecimal("4")}
                    ));

            List<MonthlyStockMovementDTO> out = service.getMonthlyStockMovement(
                    LocalDate.parse("2024-02-01"), LocalDate.parse("2024-03-31"), null);

            assertEquals(2, out.size());
            assertEquals("2024-02", out.get(0).month());
            assertEquals(5L, out.get(0).stockIn());
            assertEquals(2L, out.get(0).stockOut());
        }

        @Test
        void should_delegate_to_repository_with_converted_date_boundaries() {
            List<PriceTrendDTO> expected = Arrays.asList(
                    new PriceTrendDTO("2024-02-01", new BigDecimal("4.25")),
                    new PriceTrendDTO("2024-02-02", new BigDecimal("4.40"))
            );
            when(stockHistoryRepository.getItemPriceTrend(eq("I1"), eq("S1"),
                    any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(expected);

            List<PriceTrendDTO> out = service.getPriceTrend("I1", "S1",
                    LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-03"));

            assertEquals(expected, out);
            verify(stockHistoryRepository).getItemPriceTrend(eq("I1"), eq("S1"),
                    any(LocalDateTime.class), any(LocalDateTime.class));
        }
    }
}
