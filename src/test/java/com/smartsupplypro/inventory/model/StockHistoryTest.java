package com.smartsupplypro.inventory.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Unit tests for {@link StockHistory}.
 *
 * <p><strong>Scope</strong>: Exercises the entity lifecycle defaulting behavior in
 * {@link StockHistory#prePersist()} and sanity-checks Lombok-generated methods.
 *
 * <p><strong>Note</strong>: These tests call {@code prePersist()} directly rather than requiring
 * a JPA provider; the goal is to validate the pure Java logic that runs during persistence.
 */
class StockHistoryTest {

    @Test
    /**
     * Scenario: A stock history row is being created without an explicit timestamp.
     * Expectation: {@link StockHistory#prePersist()} populates the timestamp to "now".
     */
    void prePersist_setsTimestamp_whenMissing() {
        // Arrange
        LocalDateTime start = LocalDateTime.now();

        StockHistory history = new StockHistory();
        history.setId("h-1");
        history.setItemId("item-1");
        history.setChange(10);
        history.setReason(StockChangeReason.INITIAL_STOCK);
        history.setCreatedBy("tester");
        history.setTimestamp(null);

        // Act
        history.prePersist();

        // Assert
        Assertions.assertThat(history.getTimestamp()).isNotNull();
        Assertions.assertThat(history.getTimestamp()).isAfterOrEqualTo(start);
    }

    @Test
    /**
     * Scenario: Timestamp was already set by the service layer.
     * Expectation: {@link StockHistory#prePersist()} must not overwrite the provided timestamp.
     */
    void prePersist_doesNotChangeTimestamp_whenAlreadyPresent() {
        // Arrange
        LocalDateTime fixed = LocalDateTime.parse("2026-01-02T00:00:00");

        StockHistory history = new StockHistory();
        history.setTimestamp(fixed);

        // Act
        history.prePersist();

        // Assert
        Assertions.assertThat(history.getTimestamp()).isEqualTo(fixed);
    }

    @Test
    /**
     * Smoke test for Lombok-generated methods (builder/getters/equals/hashCode/toString).
     *
     * <p><strong>Why</strong>: Entity classes are frequently logged and used in assertions; ensuring
     * these methods behave consistently improves debuggability and prevents accidental regressions
     * when fields are added/renamed.
     */
    void lombokDataMethods_smokeTest() {
        // Arrange
        LocalDateTime ts = LocalDateTime.parse("2026-01-01T10:15:30");

        StockHistory h1 = StockHistory.builder()
            .id("h-1")
            .itemId("item-1")
            .supplierId("sup-1")
            .change(-2)
            .reason(StockChangeReason.SOLD)
            .createdBy("carlo")
            .timestamp(ts)
            .priceAtChange(new BigDecimal("3.33"))
            .inventoryItem(null)
            .supplier(null)
            .build();

        StockHistory h2 = StockHistory.builder()
            .id("h-1")
            .itemId("item-1")
            .supplierId("sup-1")
            .change(-2)
            .reason(StockChangeReason.SOLD)
            .createdBy("carlo")
            .timestamp(ts)
            .priceAtChange(new BigDecimal("3.33"))
            .inventoryItem(null)
            .supplier(null)
            .build();

        // Assert
        Assertions.assertThat(h1.getReason()).isEqualTo(StockChangeReason.SOLD);
        Assertions.assertThat(h1).isEqualTo(h2);
        Assertions.assertThat(h1.hashCode()).isEqualTo(h2.hashCode());
        Assertions.assertThat(h1.toString()).contains("item-1");
    }
}
