package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Unit tests for {@link AnalyticsControllerValidationHelper} covering boundary conditions,
 * error messages, and optional-parameter permissiveness for all validation methods.
 */
class AnalyticsControllerValidationHelperTest {

    private final AnalyticsControllerValidationHelper helper = new AnalyticsControllerValidationHelper();

    @Test
    void should_reject_when_both_datetime_bounds_are_present_and_inverted() {
        LocalDateTime start = LocalDateTime.of(2025, 1, 2, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 1, 0, 0);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateTimeRange(start, end, "startDate", "endDate"));
        assertEquals("startDate must be on or before endDate", ex.getMessage());
    }

    @Test
    void should_allow_when_a_datetime_bound_is_null() {
        LocalDateTime now = LocalDateTime.of(2025, 1, 1, 0, 0);

        assertDoesNotThrow(() -> helper.validateDateTimeRange(null, now, "startDate", "endDate"));
        assertDoesNotThrow(() -> helper.validateDateTimeRange(now, null, "startDate", "endDate"));
        assertDoesNotThrow(() -> helper.validateDateTimeRange(null, null, "startDate", "endDate"));
    }

    @Test
    void should_default_only_the_missing_bound_when_completing_a_one_sided_window() {
        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 31, 0, 0);

        LocalDateTime before = LocalDateTime.now();
        LocalDateTime[] startOnly = helper.completeDateWindow(start, null);
        LocalDateTime[] endOnly = helper.completeDateWindow(null, end);
        LocalDateTime after = LocalDateTime.now();

        assertEquals(start, startOnly[0]);
        assertTrue(!startOnly[1].isBefore(before) && !startOnly[1].isAfter(after));
        assertEquals(end, endOnly[1]);
        assertTrue(!endOnly[0].isBefore(before.minusDays(30)) && !endOnly[0].isAfter(after.minusDays(30)));
    }

    @Test
    void should_default_to_the_last_30_days_or_keep_both_bounds_when_completing_a_window() {
        LocalDateTime[] defaulted = helper.completeDateWindow(null, null);
        assertEquals(defaulted[1], defaulted[0].plusDays(30));

        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 31, 0, 0);
        LocalDateTime[] given = helper.completeDateWindow(start, end);
        assertEquals(start, given[0]);
        assertEquals(end, given[1]);
    }

    @Test
    void should_populate_every_field_when_building_a_filter() {
        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 31, 0, 0);

        StockUpdateFilterDTO filter = helper.buildFilter(start, end, "Monitor", "sup-1", "admin", 5, 100);

        assertNotNull(filter);
        assertEquals(start, filter.getStartDate());
        assertEquals(end, filter.getEndDate());
        assertEquals("Monitor", filter.getItemName());
        assertEquals("sup-1", filter.getSupplierId());
        assertEquals("admin", filter.getCreatedBy());
        assertEquals(5, filter.getMinChange());
        assertEquals(100, filter.getMaxChange());
    }

    @Test
    void should_allow_null_fields_when_building_a_filter() {
        StockUpdateFilterDTO filter = helper.buildFilter(null, null, null, null, null, null, null);

        assertNotNull(filter);
        assertNull(filter.getStartDate());
        assertNull(filter.getEndDate());
        assertNull(filter.getItemName());
        assertNull(filter.getSupplierId());
        assertNull(filter.getCreatedBy());
        assertNull(filter.getMinChange());
        assertNull(filter.getMaxChange());
    }
}
