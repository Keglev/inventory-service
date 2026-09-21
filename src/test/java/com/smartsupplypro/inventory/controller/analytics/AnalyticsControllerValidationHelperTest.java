package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    void should_reject_when_a_date_range_bound_is_null() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(null, LocalDate.now(), "start", "end"));
        assertEquals("start and end are required", ex.getMessage());

        ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(LocalDate.now(), null, "start", "end"));
        assertEquals("start and end are required", ex.getMessage());
    }

    @Test
    void should_reject_when_the_date_range_start_is_after_the_end() {
        LocalDate start = LocalDate.of(2025, 1, 2);
        LocalDate end = LocalDate.of(2025, 1, 1);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(start, end, "from", "to"));
        assertEquals("from must be on or before to", ex.getMessage());
    }

    @Test
    void should_accept_when_the_date_range_is_valid() {
        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 1, 2);

        assertDoesNotThrow(() -> helper.validateDateRange(start, end, "from", "to"));
    }

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
    void should_reject_when_a_required_value_is_null_or_blank() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.requireNonBlank(null, "supplierId"));
        assertEquals("supplierId must not be blank", ex.getMessage());

        ex = assertThrows(InvalidRequestException.class,
                () -> helper.requireNonBlank("   ", "supplierId"));
        assertEquals("supplierId must not be blank", ex.getMessage());
    }

    @Test
    void should_accept_when_a_required_value_is_not_blank() {
        assertDoesNotThrow(() -> helper.requireNonBlank("s1", "supplierId"));
    }

    @Test
    void should_reject_when_the_numeric_min_exceeds_the_max() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateNumericRange(10, 5, "min", "max"));
        assertEquals("min must be <= max", ex.getMessage());
    }

    @Test
    void should_allow_when_the_numeric_range_is_null_or_valid() {
        assertDoesNotThrow(() -> helper.validateNumericRange(null, 5, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, null, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(null, null, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, 5, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, 6, "min", "max"));
    }

    @Test
    void should_default_to_the_last_30_days_when_both_dates_are_null() {
        LocalDateTime[] window = helper.applyDefaultDateWindow(null, null);

        assertNotNull(window);
        assertEquals(2, window.length);
        assertNotNull(window[0]);
        assertNotNull(window[1]);

        assertEquals(window[1], window[0].plusDays(30));
    }

    @Test
    void should_leave_the_window_unchanged_when_either_date_is_provided() {
        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 31, 0, 0);

        LocalDateTime[] window = helper.applyDefaultDateWindow(start, null);
        assertEquals(start, window[0]);
        assertNull(window[1]);

        window = helper.applyDefaultDateWindow(null, end);
        assertNull(window[0]);
        assertEquals(end, window[1]);

        window = helper.applyDefaultDateWindow(start, end);
        assertEquals(start, window[0]);
        assertEquals(end, window[1]);
    }

    @Test
    void should_validate_datetime_and_numeric_ranges_when_checking_a_stock_update_filter() {
        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(LocalDateTime.of(2025, 1, 2, 0, 0));
        filter.setEndDate(LocalDateTime.of(2025, 1, 1, 0, 0));

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateStockUpdateFilter(filter));
        assertEquals("startDate must be on or before endDate", ex.getMessage());

        filter.setStartDate(LocalDateTime.of(2025, 1, 1, 0, 0));
        filter.setEndDate(LocalDateTime.of(2025, 1, 2, 0, 0));
        filter.setMinChange(10);
        filter.setMaxChange(5);

        ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateStockUpdateFilter(filter));
        assertEquals("minChange must be <= maxChange", ex.getMessage());

        filter.setMaxChange(10);
        assertDoesNotThrow(() -> helper.validateStockUpdateFilter(filter));
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
