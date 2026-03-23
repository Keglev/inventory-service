package com.smartsupplypro.inventory.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link InventoryItem}.
 *
 * <p><strong>Scope</strong>: Validates entity lifecycle defaults applied by {@link InventoryItem#onCreate()}.
 * These tests intentionally avoid any JPA/Spring context; they invoke the callback method directly.
 *
 * <p><strong>Why this matters</strong>: The {@code @PrePersist} callback is relied upon to enforce
 * baseline invariants (IDs, audit metadata, and supplier resolution) so both production flows and
 * test fixtures behave consistently.
 */
class InventoryItemTest {

    @Test
    /**
     * Scenario: An item is about to be persisted with missing/blank audit and supplier fields.
     * Expectation: Defaults are applied deterministically (ID generated, createdAt set, createdBy set,
     * minimumQuantity defaulted, and supplierId resolved to a default value).
     */
    void onCreate_populatesDefaults_whenFieldsMissing() {
        // Arrange: create a mostly-empty entity to exercise the defaulting rules.
        LocalDateTime start = LocalDateTime.now();

        InventoryItem item = InventoryItem.builder()
            .id("   ")
            .name("Widget")
            .quantity(0)
            .price(new BigDecimal("1.23"))
            .supplierId(null)
            .createdBy("\t")
            .minimumQuantity(0)
            .createdAt(null)
            .supplier(null)
            .build();

        // Act: simulate the JPA lifecycle callback.
        item.onCreate();

        // Assert: defaults are applied.
        Assertions.assertThat(item.getId()).isNotBlank();
        Assertions.assertThat(item.getCreatedBy()).isEqualTo("system");
        Assertions.assertThat(item.getMinimumQuantity()).isEqualTo(10);
        Assertions.assertThat(item.getSupplierId()).isEqualTo("default-supplier");
        Assertions.assertThat(item.getCreatedAt()).isNotNull();
        Assertions.assertThat(item.getCreatedAt()).isAfterOrEqualTo(start);
    }

    @Test
    /**
     * Scenario: The supplier relationship is set, but {@code supplierId} is missing/blank.
     * Expectation: {@link InventoryItem#onCreate()} resolves the FK value from {@link Supplier#getId()}.
     */
    void onCreate_resolvesSupplierId_fromSupplier_whenMissingSupplierId() {
        // Arrange: supplier present, but the denormalized supplierId is blank.
        Supplier supplier = Supplier.builder()
            .id("sup-1")
            .name("Acme")
            .createdBy("tester")
            .createdAt(null)
            .build();

        InventoryItem item = new InventoryItem();
        item.setName("Widget");
        item.setQuantity(1);
        item.setPrice(new BigDecimal("9.99"));
        item.setSupplier(supplier);
        item.setSupplierId("  ");

        // Act
        item.onCreate();

        // Assert
        Assertions.assertThat(item.getSupplierId()).isEqualTo("sup-1");

        // Sanity check: Lombok-generated toString is exercised (counts toward coverage and helps debugging).
        Assertions.assertThat(item.toString()).contains("Widget");
    }

    @Test
    /**
     * Scenario: A new item is persisted with {@code id == null} and {@code supplierId == null}, but a supplier object exists.
     * Expectation: ID is generated and supplierId is resolved from the supplier relationship.
     */
    void onCreate_generatesId_whenIdIsNull_andResolvesSupplierId_whenSupplierIdIsNull() {
        // Arrange
        Supplier supplier = Supplier.builder()
            .id("sup-2")
            .name("Globex")
            .createdBy("tester")
            .createdAt(null)
            .build();

        InventoryItem item = InventoryItem.builder()
            .id(null)
            .name("Widget")
            .quantity(1)
            .price(new BigDecimal("9.99"))
            .supplierId(null)
            .createdBy("carlo")
            .minimumQuantity(1)
            .createdAt(LocalDateTime.parse("2026-01-01T10:15:30"))
            .supplier(supplier)
            .build();

        // Act
        item.onCreate();

        // Assert
        Assertions.assertThat(item.getId()).isNotBlank();
        Assertions.assertThat(item.getSupplierId()).isEqualTo("sup-2");
    }

    @Test
    /**
     * Scenario: No supplier relationship is provided and the supplierId field is blank.
     * Expectation: {@link InventoryItem#onCreate()} assigns a safe default supplierId.
     */
    void onCreate_setsDefaultSupplier_whenSupplierIsNull_andSupplierIdIsBlank() {
        // Arrange
        InventoryItem item = InventoryItem.builder()
            .id("fixed-id")
            .name("Widget")
            .quantity(1)
            .price(new BigDecimal("9.99"))
            .supplierId("  ")
            .createdBy("carlo")
            .minimumQuantity(1)
            .createdAt(LocalDateTime.parse("2026-01-01T10:15:30"))
            .supplier(null)
            .build();

        // Act
        item.onCreate();

        // Assert
        Assertions.assertThat(item.getSupplierId()).isEqualTo("default-supplier");
    }

    @Test
    /**
     * Scenario: No supplier relationship is provided, but a supplierId is already set.
     * Expectation: {@link InventoryItem#onCreate()} must not override the explicit supplierId.
     */
    void onCreate_doesNotOverrideSupplierId_whenSupplierIsNull_andSupplierIdIsProvided() {
        // Arrange
        InventoryItem item = InventoryItem.builder()
            .id("fixed-id")
            .name("Widget")
            .quantity(1)
            .price(new BigDecimal("9.99"))
            .supplierId("sup-provided")
            .createdBy("carlo")
            .minimumQuantity(1)
            .createdAt(LocalDateTime.parse("2026-01-01T10:15:30"))
            .supplier(null)
            .build();

        // Act
        item.onCreate();

        // Assert
        Assertions.assertThat(item.getSupplierId()).isEqualTo("sup-provided");
    }

    @Test
    /**
     * Scenario: All fields are already set to intentional values.
     * Expectation: {@link InventoryItem#onCreate()} does not overwrite explicit values.
     *
     * <p>This test also exercises Lombok {@code equals/hashCode} for basic object identity semantics.
     */
    void onCreate_doesNotOverrideExplicitFields_whenAlreadySet() {
        // Arrange
        LocalDateTime fixedCreatedAt = LocalDateTime.parse("2026-01-01T10:15:30");

        Supplier supplier = Supplier.builder()
            .id("sup-1")
            .name("Acme")
            .createdBy("tester")
            .createdAt(null)
            .build();

        InventoryItem item = InventoryItem.builder()
            .id("fixed-id")
            .name("Widget")
            .quantity(5)
            .price(new BigDecimal("2.50"))
            .supplierId("sup-fixed")
            .createdBy("carlo")
            .minimumQuantity(3)
            .createdAt(fixedCreatedAt)
            .supplier(supplier)
            .build();

        // Act
        item.onCreate();

        // Assert
        Assertions.assertThat(item.getId()).isEqualTo("fixed-id");
        Assertions.assertThat(item.getCreatedAt()).isEqualTo(fixedCreatedAt);
        Assertions.assertThat(item.getCreatedBy()).isEqualTo("carlo");
        Assertions.assertThat(item.getMinimumQuantity()).isEqualTo(3);
        Assertions.assertThat(item.getSupplierId()).isEqualTo("sup-fixed");

        InventoryItem same = InventoryItem.builder()
            .id("fixed-id")
            .name("Widget")
            .quantity(5)
            .price(new BigDecimal("2.50"))
            .supplierId("sup-fixed")
            .createdBy("carlo")
            .minimumQuantity(3)
            .createdAt(fixedCreatedAt)
            .supplier(supplier)
            .build();

        // Assert: Lombok equality contract is stable for identical values.
        Assertions.assertThat(item).isEqualTo(same);
        Assertions.assertThat(item.hashCode()).isEqualTo(same.hashCode());
    }
}
