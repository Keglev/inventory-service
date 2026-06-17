package com.smartsupplypro.inventory.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for custom helper methods in {@link InventoryItem}.
 */
class InventoryItemTest {

    @Test
    void should_set_defaults_when_fields_are_missing() {
        LocalDateTime before = LocalDateTime.now();
        InventoryItem item = blankItem();
        item.onCreate();
        Assertions.assertThat(item.getId()).isNotBlank();
        Assertions.assertThat(item.getCreatedBy()).isEqualTo("system");
        Assertions.assertThat(item.getMinimumQuantity()).isEqualTo(10);
        Assertions.assertThat(item.getSupplierId()).isEqualTo("default-supplier");
        Assertions.assertThat(item.getCreatedAt()).isAfterOrEqualTo(before);
    }

    @Test
    void should_resolve_supplier_id_from_supplier_when_supplier_id_is_blank() {
        Supplier s = Supplier.builder().id("sup-1").name("Acme").createdBy("t").build();
        InventoryItem item = InventoryItem.builder().name("W").quantity(1)
                .price(new BigDecimal("1.00")).supplier(s).supplierId("  ").build();
        item.onCreate();
        Assertions.assertThat(item.getSupplierId()).isEqualTo("sup-1");
    }

    @Test
    void should_use_default_supplier_when_no_supplier_entity_is_set() {
        InventoryItem item = InventoryItem.builder().name("W").quantity(1)
                .price(new BigDecimal("1.00")).supplierId("  ").supplier(null).build();
        item.onCreate();
        Assertions.assertThat(item.getSupplierId()).isEqualTo("default-supplier");
    }

    @Test
    void should_not_override_supplier_id_when_already_provided() {
        Supplier s = Supplier.builder().id("sup-X").name("X").createdBy("t").build();
        InventoryItem item = InventoryItem.builder().name("W").quantity(1)
                .price(new BigDecimal("1.00")).supplierId("sup-fixed").supplier(s).build();
        item.onCreate();
        Assertions.assertThat(item.getSupplierId()).isEqualTo("sup-fixed");
    }

    @Test
    void should_not_override_explicit_fields_when_already_set() {
        LocalDateTime ts = LocalDateTime.parse("2026-01-01T10:15:30");
        InventoryItem item = InventoryItem.builder().id("id-1").name("W")
                .quantity(5).price(new BigDecimal("1.00")).supplierId("sup-1")
                .createdBy("carlo").minimumQuantity(3).createdAt(ts).build();
        item.onCreate();
        Assertions.assertThat(item.getId()).isEqualTo("id-1");
        Assertions.assertThat(item.getCreatedBy()).isEqualTo("carlo");
        Assertions.assertThat(item.getMinimumQuantity()).isEqualTo(3);
    }

    private InventoryItem blankItem() {
        return InventoryItem.builder()
                .id("   ").name("W").quantity(0).price(new BigDecimal("1.23"))
                .supplierId(null).createdBy("\t").minimumQuantity(0)
                .createdAt(null).supplier(null).build();
    }
}
