package com.smartsupplypro.inventory.model;

import java.time.LocalDateTime;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for custom helper methods in {@link StockHistory}.
 */
class StockHistoryTest {

    @Test
    void should_set_timestamp_when_missing() {
        LocalDateTime before = LocalDateTime.now();
        StockHistory history = new StockHistory();
        history.prePersist();
        Assertions.assertThat(history.getTimestamp()).isNotNull();
        Assertions.assertThat(history.getTimestamp()).isAfterOrEqualTo(before);
    }

    @Test
    void should_not_override_timestamp_when_already_set() {
        LocalDateTime fixed = LocalDateTime.parse("2026-01-02T00:00:00");
        StockHistory history = new StockHistory();
        history.setTimestamp(fixed);
        history.prePersist();
        Assertions.assertThat(history.getTimestamp()).isEqualTo(fixed);
    }
}
