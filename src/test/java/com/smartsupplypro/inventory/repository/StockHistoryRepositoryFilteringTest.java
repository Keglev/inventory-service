package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

/**
 * Tests for StockHistoryRepository filtering operations.
 * 
 * Verifies date filtering, pagination, item/supplier/reason queries.
 * Uses H2 in-memory database with fixed clock for deterministic tests.
 */
@SuppressWarnings("unused")
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockHistoryRepositoryFilteringTest {

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
     * Preloads sample data for filtering tests.
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
     * Tests paginated filtering with date range, item name, and supplier.
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
     * Tests filtering by item ID.
     */
    @Test
    @DisplayName("Should return stock history by item ID")
    void testFindByItemId() {
        List<StockHistory> result = stockHistoryRepository.findByItemId(item1.getId());

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(h -> h.getItemId().equals(item1.getId())));
    }

    /**
     * Tests filtering by change reason enum.
     */
    @Test
    @DisplayName("Should return stock history by reason")
    void testFindByReason() {
        List<StockHistory> result = stockHistoryRepository.findByReason(StockChangeReason.INITIAL_STOCK);

        assertEquals(1, result.size());
        assertEquals(StockChangeReason.INITIAL_STOCK, result.get(0).getReason());
    }
}
