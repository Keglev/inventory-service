package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

/**
 * Integration tests for {@link StockHistoryRepository} analytics query correctness
 * using {@link org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest}.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockHistoryRepositoryAnalyticsTest {

    @Autowired private StockHistoryRepository stockHistoryRepository;
    @Autowired private InventoryItemRepository inventoryItemRepository;
    @Autowired private SupplierRepository supplierRepository;

    private final Clock fixedClock = Clock.fixed(Instant.parse("2025-08-06T12:00:00Z"), ZoneId.of("UTC"));

    private InventoryItem item1;
    private InventoryItem item2;
    private Supplier supplierA;
    private Supplier supplierB;
    private LocalDateTime now;

    @BeforeEach
    void setup() {
        now = LocalDateTime.now(fixedClock);

        supplierA = supplierRepository.save(Supplier.builder()
                .id("sup-a").name("Alpha GmbH").contactName("Alice")
                .email("alice@alpha.com").phone("123456").createdBy("admin").createdAt(now).build());
        supplierB = supplierRepository.save(Supplier.builder()
                .id("sup-b").name("Beta GmbH").contactName("Bob")
                .email("bob@beta.com").phone("654321").createdBy("admin").createdAt(now).build());

        item1 = inventoryItemRepository.save(InventoryItem.builder()
                .id("item-1").name("Wrench").sku("SKU-SHA-1").price(BigDecimal.valueOf(20))
                .quantity(100).minimumQuantity(10).supplier(supplierA).createdBy("admin").build());
        item2 = inventoryItemRepository.save(InventoryItem.builder()
                .id("item-2").name("Hammer").sku("SKU-SHA-2").price(BigDecimal.valueOf(15))
                .quantity(50).minimumQuantity(5).supplier(supplierB).createdBy("admin").build());
        inventoryItemRepository.save(InventoryItem.builder()
                .id("item-3").name("Screwdriver").sku("SKU-SHA-3").price(BigDecimal.valueOf(12))
                .quantity(80).minimumQuantity(10).supplier(supplierA).createdBy("admin").build());

        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-1").itemId("item-1").supplierId("sup-a")
                .change(10).reason(StockChangeReason.INITIAL_STOCK).createdBy("admin")
                .timestamp(now.minusDays(2)).priceAtChange(BigDecimal.valueOf(22)).build());
        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-2").itemId("item-1").supplierId("sup-a")
                .change(-5).reason(StockChangeReason.SOLD).createdBy("admin")
                .timestamp(now.minusDays(1)).priceAtChange(BigDecimal.valueOf(20)).build());
        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-3").itemId("item-3").supplierId("sup-a")
                .change(15).reason(StockChangeReason.MANUAL_UPDATE).createdBy("admin")
                .timestamp(now.minusDays(1)).priceAtChange(BigDecimal.valueOf(12)).build());
        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-4").itemId("item-2").supplierId("sup-b")
                .change(-20).reason(StockChangeReason.SOLD).createdBy("admin")
                .timestamp(now.minusDays(1)).priceAtChange(BigDecimal.valueOf(15)).build());
    }

    /**
     * Daily valuation and supplier-level aggregation queries.
     */
    @Nested
    class AggregationQueries {

        @Test
        void should_return_stock_value_aggregated_by_day() {
            List<Object[]> result = stockHistoryRepository.getDailyStockValuation(now.minusDays(3), now, null);

            assertEquals(2, result.size());
            result.forEach(row -> { assertNotNull(row[0]); assertNotNull(row[1]); });
        }

        @Test
        void should_return_total_stock_per_supplier() {
            List<Object[]> result = stockHistoryRepository.getTotalStockBySupplier();

            assertTrue(result.size() >= 2);
            result.forEach(row -> {
                assertNotNull(row[0]);
                assertTrue(((Number) row[1]).intValue() > 0);
            });
        }

        @Test
        void should_return_update_counts_per_item_grouped_by_supplier() {
            List<Object[]> result = stockHistoryRepository.getUpdateCountByItem(supplierA.getId());

            assertEquals(2, result.size());
            Optional<Object[]> wrench = result.stream().filter(r -> "Wrench".equals(r[0])).findFirst();
            Optional<Object[]> screwdriver = result.stream().filter(r -> "Screwdriver".equals(r[0])).findFirst();
            assertTrue(wrench.isPresent());
            assertEquals(2L, ((Number) wrench.get()[1]).longValue());
            assertTrue(screwdriver.isPresent());
            assertEquals(1L, ((Number) screwdriver.get()[1]).longValue());
        }
    }

    /**
     * Monthly movement reports and low-stock/tabular export queries.
     */
    @Nested
    class MovementReporting {

        @Test
        void should_return_monthly_stock_movement_globally() {
            List<Object[]> result = stockHistoryRepository.getMonthlyStockMovement(
                    now.minusMonths(1), now.plusDays(1));

            assertEquals(1, result.size());
            assertTrue(result.get(0)[0].toString().matches("\\d{4}-\\d{2}"));
            assertNotNull(result.get(0)[1]);
            assertNotNull(result.get(0)[2]);
        }

        @Test
        void should_return_monthly_stock_movement_filtered_by_supplier() {
            List<Object[]> result = stockHistoryRepository.getMonthlyStockMovementBySupplier(
                    now.minusMonths(1), now.plusDays(1), supplierA.getId());

            assertEquals(1, result.size());
            assertTrue(result.get(0)[0].toString().matches("\\d{4}-\\d{2}"));
        }

        @Test
        void should_return_items_below_minimum_stock_for_supplier() {
            item2.setQuantity(3);
            item2.setMinimumQuantity(5);
            inventoryItemRepository.save(item2);

            assertEquals(1, stockHistoryRepository.findItemsBelowMinimumStock(supplierB.getId()).size());
        }

        @Test
        void should_return_filtered_stock_updates_for_tabular_export() {
            List<Object[]> result = stockHistoryRepository.searchStockUpdates(
                    now.minusDays(3), now, "Wrench", supplierA.getId(), "admin", -10, 20);

            assertEquals(2, result.size());
            assertEquals("Wrench", result.get(0)[0]);
            assertEquals("Alpha GmbH", result.get(0)[1]);
            assertEquals("admin", result.get(0)[4]);
        }
    }

    /**
     * Price trend DTO projection and supplier-filtered variant.
     */
    @Nested
    class PriceTrend {

        @Test
        void should_return_price_trend_dtos_for_item_and_date_range() {
            List<PriceTrendDTO> result = stockHistoryRepository.getPriceTrend(
                    item1.getId(), now.minusDays(3), now);

            assertEquals(2, result.size());
            assertTrue(result.get(0).getPrice().compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        void should_return_supplier_filtered_price_trend_via_custom_query() {
            List<PriceTrendDTO> result = stockHistoryRepository
                    .getItemPriceTrend(item1.getId(), supplierA.getId(), now.minusDays(3), now);

            assertEquals(2, result.size());
            assertNotNull(result.get(0).getPrice());
        }
    }
}
