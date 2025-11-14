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
import static org.junit.jupiter.api.Assertions.fail;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

/**
 * Tests for StockHistoryRepository analytics and aggregation operations.
 * 
 * Verifies native SQL aggregations, DTO projections, and supplier-specific analytics.
 * Uses H2 in-memory database with fixed clock for deterministic results.
 */
@SuppressWarnings("unused")
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockHistoryRepositoryAnalyticsTest {

    @Autowired
    private StockHistoryRepository stockHistoryRepository;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    private final Clock fixedClock = Clock.fixed(
            Instant.parse("2025-08-06T12:00:00Z"),
            ZoneId.of("UTC")
    );

    private InventoryItem item1;
    private InventoryItem item2;

    private Supplier supplierA;
    private Supplier supplierB;

    private LocalDateTime now;

    /**
     * Preloads sample data for analytics tests.
     */
    @BeforeEach
    void setup() {
        now = LocalDateTime.now(fixedClock);

        supplierA = supplierRepository.save(Supplier.builder()
                .id("sup-a")
                .name("Alpha GmbH")
                .contactName("Alice")
                .email("alice@alpha.com")
                .phone("123456")
                .createdBy("admin")
                .createdAt(now)
                .build());

        supplierB = supplierRepository.save(Supplier.builder()
                .id("sup-b")
                .name("Beta GmbH")
                .contactName("Bob")
                .email("bob@beta.com")
                .phone("654321")
                .createdBy("admin")
                .createdAt(now)
                .build());

        item1 = inventoryItemRepository.save(InventoryItem.builder()
                .id("item-1")
                .name("Wrench")
                .price(BigDecimal.valueOf(20))
                .quantity(100)
                .minimumQuantity(10)
                .supplier(supplierA)
                .createdBy("admin")
                .build());

        item2 = inventoryItemRepository.save(InventoryItem.builder()
                .id("item-2")
                .name("Hammer")
                .price(BigDecimal.valueOf(15))
                .quantity(50)
                .minimumQuantity(5)
                .supplier(supplierB)
                .createdBy("admin")
                .build());

        InventoryItem item3 = inventoryItemRepository.save(InventoryItem.builder()
                .id("item-3")
                .name("Screwdriver")
                .price(BigDecimal.valueOf(12))
                .quantity(80)
                .minimumQuantity(10)
                .supplier(supplierA)
                .createdBy("admin")
                .build());

        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-1")
                .itemId(item1.getId())
                .supplierId(item1.getSupplier().getId())
                .change(10)
                .reason(StockChangeReason.INITIAL_STOCK)
                .createdBy("admin")
                .timestamp(now.minusDays(2))
                .priceAtChange(BigDecimal.valueOf(22))
                .build());

        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-2")
                .itemId(item1.getId())
                .supplierId(item1.getSupplier().getId())
                .change(-5)
                .reason(StockChangeReason.SOLD)
                .createdBy("admin")
                .timestamp(now.minusDays(1))
                .priceAtChange(BigDecimal.valueOf(20))
                .build());

        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-3")
                .itemId(item3.getId())
                .supplierId(item3.getSupplier().getId())
                .change(15)
                .reason(StockChangeReason.MANUAL_UPDATE)
                .createdBy("admin")
                .timestamp(now.minusDays(1))
                .priceAtChange(BigDecimal.valueOf(12))
                .build());

        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-4")
                .itemId(item2.getId())
                .supplierId(item2.getSupplier().getId())
                .change(-20)
                .reason(StockChangeReason.SOLD)
                .createdBy("admin")
                .timestamp(now.minusDays(1))
                .priceAtChange(BigDecimal.valueOf(15))
                .build());
    }

    /**
     * Tests stock value aggregation grouped by day.
     */
    @Test
    @DisplayName("Should return stock value aggregated by day")
    void testGetStockValueGroupedByDateFiltered() {
        List<Object[]> result = stockHistoryRepository.getDailyStockValuation(
                now.minusDays(3), now, null
        );

        assertEquals(2, result.size());
        for (Object[] row : result) {
            assertNotNull(row[0]); // date
            assertNotNull(row[1]); // total value
        }
    }

    /**
     * Tests total stock aggregation per supplier.
     */
    @Test
    @DisplayName("Should return total stock per supplier")
    void testGetTotalStockPerSupplier() {
        List<Object[]> result = stockHistoryRepository.getTotalStockBySupplier();

        assertTrue(result.size() >= 2);
        for (Object[] row : result) {
            assertNotNull(row[0]); // supplier name
            assertTrue(((Number) row[1]).intValue() > 0); // total quantity
        }
    }

    /**
     * Tests update frequency analytics for single item.
     */
    @Test
    @DisplayName("Should return update count per item filtered by supplier (single item)")
    void testgetUpdateCountByItem_singleItem() {
        List<Object[]> result = stockHistoryRepository.getUpdateCountByItem(supplierA.getId());

        Optional<Object[]> wrenchEntry = result.stream()
            .filter(row -> "Wrench".equals(row[0]))
            .findFirst();

        assertTrue(wrenchEntry.isPresent());
        assertEquals(2L, ((Number) wrenchEntry.get()[1]).longValue());
    }

    /**
     * Tests update frequency analytics for multiple items.
     */
    @Test
    @DisplayName("Should return update count per item filtered by supplier (multiple items)")
    void testgetUpdateCountByItem_multipleItems() {
        List<Object[]> result = stockHistoryRepository.getUpdateCountByItem(supplierA.getId());

        assertEquals(2, result.size());

        for (Object[] row : result) {
            String itemName = (String) row[0];
            long updateCount = ((Number) row[1]).longValue();

            switch (itemName) {
                case "Wrench" -> assertEquals(2L, updateCount);
                case "Screwdriver" -> assertEquals(1L, updateCount);
                default -> fail("Unexpected item name: " + itemName);
            }
        }
    }

    /**
     * Tests global monthly stock movement aggregation.
     */
    @Test
    @DisplayName("Should return monthly stock movement globally")
    void testGetMonthlyStockMovement() {
        List<Object[]> result = stockHistoryRepository.getMonthlyStockMovement(
                now.minusMonths(1), now.plusDays(1)
        );

        assertEquals(1, result.size());
        Object[] row = result.get(0);
        assertTrue(row[0].toString().matches("\\d{4}-\\d{2}")); // month format
        assertNotNull(row[1]); // stock_in
        assertNotNull(row[2]); // stock_out
    }

    /**
     * Tests supplier-specific monthly stock movement.
     */
    @Test
    @DisplayName("Should return monthly stock movement filtered by supplier")
    void testGetMonthlyStockMovementFiltered() {
        List<Object[]> result = stockHistoryRepository.getMonthlyStockMovementBySupplier(
                now.minusMonths(1), now.plusDays(1), supplierA.getId()
        );

        assertEquals(1, result.size());
        Object[] row = result.get(0);
        assertTrue(row[0].toString().matches("\\d{4}-\\d{2}"));
        assertNotNull(row[1]);
        assertNotNull(row[2]);
    }

    /**
     * Tests low-stock items query for dashboard reporting.
     */
    @Test
    @DisplayName("Should return items below minimum stock")
    void testFindItemsBelowMinimumStockFiltered() {
        item2.setQuantity(3);
        item2.setMinimumQuantity(5);
        inventoryItemRepository.save(item2);

        List<Object[]> result = stockHistoryRepository.findItemsBelowMinimumStock(supplierB.getId());
        assertEquals(1, result.size());
    }

    /**
     * Tests filtered stock updates for tabular export.
     */
    @Test
    @DisplayName("Should return filtered stock updates for tabular export")
    void testFindFilteredStockUpdates() {
        List<Object[]> result = stockHistoryRepository.searchStockUpdates(
                now.minusDays(3),
                now,
                "Wrench",
                supplierA.getId(),
                "admin",
                -10,
                20
        );

        assertEquals(2, result.size());
        Object[] row = result.get(0);
        assertEquals("Wrench", row[0]);
        assertEquals("Alpha GmbH", row[1]);
        assertEquals("admin", row[4]);
    }

    /**
     * Tests price trend DTO projection.
     */
    @Test
    @DisplayName("Should return price trend DTOs for given item and date range")
    void testGetPriceTrendDTOProjection() {
        List<PriceTrendDTO> result = stockHistoryRepository.getPriceTrend(
                item1.getId(),
                now.minusDays(3),
                now
        );

        assertEquals(2, result.size());
        assertTrue(result.get(0).getPrice().compareTo(BigDecimal.ZERO) > 0);
    }

    /**
     * Tests supplier-filtered price trend using custom repository.
     */
    @Test
    @DisplayName("Should return supplier-filtered price trend DTOs using custom fallback SQL")
    void testGetPriceTrendFiltered() {
        List<PriceTrendDTO> result = stockHistoryRepository
            .getItemPriceTrend(item1.getId(), supplierA.getId(), now.minusDays(3), now);

        assertEquals(2, result.size());
        assertNotNull(result.get(0).getPrice());
    }
}
