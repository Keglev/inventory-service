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
 * Unit tests for {@link AnalyticsControllerValidationHelper}.
 *
 * <p><strong>Why dedicated unit tests?</strong>
 * The MVC tests for {@link com.smartsupplypro.inventory.controller.AnalyticsController}
 * typically mock this helper to isolate endpoint wiring from validation logic. These unit tests
 * make the validation rules explicit and keep the coverage signal accurate.
 *
 * <p><strong>Scope</strong>
 * This suite targets boundary conditions and error messages (since these messages surface
 * to API clients via exception handlers) and validates that the helper is permissive where
 * the controller allows optional parameters.
 */
class AnalyticsControllerValidationHelperTest {

    private final AnalyticsControllerValidationHelper helper = new AnalyticsControllerValidationHelper();

    @Test
    void validateDateRange_shouldRejectNulls() {
        // Given/When/Then: null bounds are rejected with a parameterized message
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(null, LocalDate.now(), "start", "end"));
        assertEquals("start and end are required", ex.getMessage());

        ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(LocalDate.now(), null, "start", "end"));
        assertEquals("start and end are required", ex.getMessage());
    }

    @Test
    void validateDateRange_shouldRejectStartAfterEnd() {
        // Given: start is after end
        LocalDate start = LocalDate.of(2025, 1, 2);
        LocalDate end = LocalDate.of(2025, 1, 1);

        // When/Then
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(start, end, "from", "to"));
        assertEquals("from must be on or before to", ex.getMessage());
    }

    @Test
    void validateDateRange_shouldAcceptValidRange() {
        // Given
        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 1, 2);

        // When/Then
        assertDoesNotThrow(() -> helper.validateDateRange(start, end, "from", "to"));
    }

    @Test
    void validateDateTimeRange_shouldRejectStartAfterEndWhenBothPresent() {
        // Given
        LocalDateTime start = LocalDateTime.of(2025, 1, 2, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 1, 0, 0);

        // When/Then
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateTimeRange(start, end, "startDate", "endDate"));
        assertEquals("startDate must be on or before endDate", ex.getMessage());
    }

    @Test
    void validateDateTimeRange_shouldAllowNullBounds() {
        // Given: controller accepts optional date time parameters
        LocalDateTime now = LocalDateTime.of(2025, 1, 1, 0, 0);

        // When/Then: null bounds are permitted
        assertDoesNotThrow(() -> helper.validateDateTimeRange(null, now, "startDate", "endDate"));
        assertDoesNotThrow(() -> helper.validateDateTimeRange(now, null, "startDate", "endDate"));
        assertDoesNotThrow(() -> helper.validateDateTimeRange(null, null, "startDate", "endDate"));
    }

    @Test
    void requireNonBlank_shouldRejectNullOrBlank() {
        // Given/When/Then
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.requireNonBlank(null, "supplierId"));
        assertEquals("supplierId must not be blank", ex.getMessage());

        ex = assertThrows(InvalidRequestException.class,
                () -> helper.requireNonBlank("   ", "supplierId"));
        assertEquals("supplierId must not be blank", ex.getMessage());
    }

    @Test
    void requireNonBlank_shouldAcceptNonBlank() {
        // When/Then
        assertDoesNotThrow(() -> helper.requireNonBlank("s1", "supplierId"));
    }

    @Test
    void validateNumericRange_shouldRejectMinGreaterThanMax() {
        // When/Then
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateNumericRange(10, 5, "min", "max"));
        assertEquals("min must be <= max", ex.getMessage());
    }

    @Test
    void validateNumericRange_shouldAllowNullsAndValidRange() {
        // When/Then: missing bounds are tolerated and valid ranges pass
        assertDoesNotThrow(() -> helper.validateNumericRange(null, 5, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, null, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(null, null, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, 5, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, 6, "min", "max"));
    }

    @Test
    void applyDefaultDateWindow_shouldDefaultLast30DaysWhenBothNull() {
        // When: both parameters are absent
        LocalDateTime[] window = helper.applyDefaultDateWindow(null, null);

        // Then: a 2-element window is returned
        assertNotNull(window);
        assertEquals(2, window.length);
        assertNotNull(window[0]);
        assertNotNull(window[1]);

        // Then: implementation sets endDate once and derives startDate from it.
        assertEquals(window[1], window[0].plusDays(30));
    }

    @Test
    void applyDefaultDateWindow_shouldNotChangeIfEitherDateProvided() {
        // Given
        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 31, 0, 0);

        // When/Then: if one side is provided, the helper returns it unchanged
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
    void validateStockUpdateFilter_shouldValidateDateTimeAndNumericRanges() {
        // Given: an invalid date-time range
        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(LocalDateTime.of(2025, 1, 2, 0, 0));
        filter.setEndDate(LocalDateTime.of(2025, 1, 1, 0, 0));

        // When/Then
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateStockUpdateFilter(filter));
        assertEquals("startDate must be on or before endDate", ex.getMessage());

        // Given: a valid date-time range but invalid numeric range
        filter.setStartDate(LocalDateTime.of(2025, 1, 1, 0, 0));
        filter.setEndDate(LocalDateTime.of(2025, 1, 2, 0, 0));
        filter.setMinChange(10);
        filter.setMaxChange(5);

        // When/Then
        ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateStockUpdateFilter(filter));
        assertEquals("minChange must be <= maxChange", ex.getMessage());

        // Given/When/Then: once corrected, the filter is accepted
        filter.setMaxChange(10);
        assertDoesNotThrow(() -> helper.validateStockUpdateFilter(filter));
    }
}
