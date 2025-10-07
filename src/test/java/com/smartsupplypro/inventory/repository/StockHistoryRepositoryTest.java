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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.custom.StockHistoryCustomRepository;

/**
 * Integration test class for {@link StockHistoryRepository}, verifying filtering, reporting,
 * and analytics queries using an in-memory H2 database.
 *
 * <p>Tests cover: date filtering, pagination, native SQL aggregation, supplier-specific analysis,
 * and DTO projection.
 */
@DataJpaTest
@ActiveProfiles("test")
class StockHistoryRepositoryTest {

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
     * Preloads sample suppliers, inventory items, and stock history with fixed timestamps.
     */
    @BeforeEach
    @SuppressWarnings("unused")
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
                .supplier(supplierA) // Same supplier as item1
                .createdBy("admin")
                .build());

        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-1")
                .itemId(item1.getId())
                .supplierId(item1.getSupplier().getId()) // Ensure supplier ID is set
                .change(10)
                .reason(StockChangeReason.INITIAL_STOCK)
                .createdBy("admin")
                .timestamp(now.minusDays(2))
                .priceAtChange(BigDecimal.valueOf(22))
                .build());

        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-2")
                .itemId(item1.getId())
                .supplierId(item1.getSupplier().getId()) // Ensure supplier ID is set
                .change(-5)
                .reason(StockChangeReason.SOLD)
                .createdBy("admin")
                .timestamp(now.minusDays(1))
                .priceAtChange(BigDecimal.valueOf(20))
                .build());
        
        
        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-3")
                .itemId(item3.getId())
                .supplierId(item3.getSupplier().getId())  // Ensure supplier ID is set (same supplier as item1)
                .change(15)
                .reason(StockChangeReason.MANUAL_UPDATE)
                .createdBy("admin")
                .timestamp(now.minusDays(1))
                .priceAtChange(BigDecimal.valueOf(12))
                .build());

        // Create stock history for item2 to support the low-stock test
        stockHistoryRepository.save(StockHistory.builder()
                .id("sh-4")
                .itemId(item2.getId())
                .supplierId(item2.getSupplier().getId()) 
                .change(-20)  // This will help with the movement tests
                .reason(StockChangeReason.SOLD)
                .createdBy("admin")
                .timestamp(now.minusDays(1))
                .priceAtChange(BigDecimal.valueOf(15))
                .build());
    }

    /**
     * Verifies paginated filtering by date range, item name, and supplier.
     */
    @Test
    @DisplayName("Should filter stock history with pagination and optional filters")
    void testFindFiltered_withAllFilters() {
        Page<StockHistory> result = stockHistoryRepository.findFiltered(
                now.minusDays(3),
                now,
                "Wrench",
                supplierA.getId(),
                PageRequest.of(0, 10)
        );

        assertEquals(2, result.getTotalElements());
    }

    /**
     * Verifies filtering by item ID.
     */
    @Test
    @DisplayName("Should return stock history by item ID")
    void testFindByItemId() {
        List<StockHistory> result = stockHistoryRepository.findByItemId(item1.getId());

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(h -> h.getItemId().equals(item1.getId())));
    }

    /**
    * Verifies filtering by change reason (enum).
    */
    @Test
    @DisplayName("Should return stock history by reason")
    void testFindByReason() {
        List<StockHistory> result = stockHistoryRepository.findByReason(StockChangeReason.INITIAL_STOCK);
    
        // First check that one result is returned
        assertEquals(1, result.size());

        // Then check that the reason matches the expected enum value
        assertEquals(StockChangeReason.INITIAL_STOCK, result.get(0).getReason());
    }

    /**
     * Verifies aggregation of stock value grouped by day.
     */
    @Test
    @DisplayName("Should return stock value aggregated by day")
    void testGetStockValueGroupedByDateFiltered() {
        List<Object[]> result = stockHistoryRepository.getStockValueGroupedByDateFiltered(
                now.minusDays(3), now, null
        );

        assertEquals(2, result.size());
        for (Object[] row : result) {
            assertNotNull(row[0]); // date
            assertNotNull(row[1]); // total value
        }
    }

    /**
     * Verifies supplier-specific aggregation of total stock quantity.
     */
    @Test
    @DisplayName("Should return total stock per supplier")
    void testGetTotalStockPerSupplier() {
        List<Object[]> result = stockHistoryRepository.getTotalStockPerSupplier();

        assertTrue(result.size() >= 2);
        for (Object[] row : result) {
            assertNotNull(row[0]); // supplier name
            assertTrue(((Number) row[1]).intValue() > 0); // total quantity
        }
    }

    /**
     * Verifies analytics endpoint for update frequency per item.
     */
    @Test
    @DisplayName("Should return update count per item filtered by supplier (single item)")
    void testGetUpdateCountPerItemFiltered_singleItem() {
        List<Object[]> result = stockHistoryRepository.getUpdateCountPerItemFiltered(supplierA.getId());

        Optional<Object[]> wrenchEntry = result.stream()
            .filter(row -> "Wrench".equals(row[0]))
            .findFirst();

        assertTrue(wrenchEntry.isPresent());
        assertEquals(2L, ((Number) wrenchEntry.get()[1]).longValue());

    }

    /**
     * Verifies global monthly stock movement aggregation.
     */
    @Test
    @DisplayName("Should return monthly stock movement globally")
    void testGetMonthlyStockMovement() {
        List<Object[]> result = stockHistoryRepository.getMonthlyStockMovement(
                now.minusMonths(1), now.plusDays(1)
        );

        assertEquals(1, result.size());
        Object[] row = result.get(0);
        assertTrue(row[0].toString().matches("\\d{4}-\\d{2}")); // month
        assertNotNull(row[1]); // stock_in
        assertNotNull(row[2]); // stock_out
    }

    /**
     * Verifies supplier-specific monthly stock movement.
     */
    @Test
    @DisplayName("Should return monthly stock movement filtered by supplier")
    void testGetMonthlyStockMovementFiltered() {
        List<Object[]> result = stockHistoryRepository.getMonthlyStockMovementFiltered(
                now.minusMonths(1), now.plusDays(1), supplierA.getId()
        );

        assertEquals(1, result.size());
        Object[] row = result.get(0);
        assertTrue(row[0].toString().matches("\\d{4}-\\d{2}")); // month
        assertNotNull(row[1]); // stock_in
        assertNotNull(row[2]); // stock_out
    }

    /**
     * Verifies low-stock items for reporting dashboards.
     */
    @Test
    @DisplayName("Should return items below minimum stock")
    void testFindItemsBelowMinimumStockFiltered() {
        item2.setQuantity(3);
        item2.setMinimumQuantity(5);
        inventoryItemRepository.save(item2);

        List<Object[]> result = stockHistoryRepository.findItemsBelowMinimumStockFiltered(supplierB.getId());
        assertEquals(1, result.size());
    }

    /**
     * Verifies exportable filtered stock updates based on all available filters.
     */
    @Test
    @DisplayName("Should return filtered stock updates for tabular export")
    void testFindFilteredStockUpdates() {
        List<Object[]> result = stockHistoryRepository.findFilteredStockUpdates(
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
     * Verifies projected DTO result for price trend queries.
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
    * Verifies supplier-specific price trend DTO projection using native SQL fallback logic.
    */
    @Test
    @DisplayName("Should return supplier-filtered price trend DTOs using custom fallback SQL")
    void testGetPriceTrendFiltered() {
        List<PriceTrendDTO> result = ((StockHistoryCustomRepository) stockHistoryRepository)
            .   getPriceTrend(item1.getId(), supplierA.getId(), now.minusDays(3), now);

        assertEquals(2, result.size());
        assertNotNull(result.get(0).getPrice());
    }


    @Test
    @DisplayName("Should return update count per item filtered by supplier (multiple items)")
    void testGetUpdateCountPerItemFiltered_multipleItems() {
        List<Object[]> result = stockHistoryRepository.getUpdateCountPerItemFiltered(supplierA.getId());

        // Expect 2 items under supplierA (Wrench and Screwdriver)
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

}

