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
    void validateDateRange_shouldRejectNulls() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(null, LocalDate.now(), "start", "end"));
        assertEquals("start and end are required", ex.getMessage());

        ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(LocalDate.now(), null, "start", "end"));
        assertEquals("start and end are required", ex.getMessage());
    }

    @Test
    void validateDateRange_shouldRejectStartAfterEnd() {
        LocalDate start = LocalDate.of(2025, 1, 2);
        LocalDate end = LocalDate.of(2025, 1, 1);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateRange(start, end, "from", "to"));
        assertEquals("from must be on or before to", ex.getMessage());
    }

    @Test
    void validateDateRange_shouldAcceptValidRange() {
        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 1, 2);

        assertDoesNotThrow(() -> helper.validateDateRange(start, end, "from", "to"));
    }

    @Test
    void validateDateTimeRange_shouldRejectStartAfterEndWhenBothPresent() {
        LocalDateTime start = LocalDateTime.of(2025, 1, 2, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 1, 0, 0);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateDateTimeRange(start, end, "startDate", "endDate"));
        assertEquals("startDate must be on or before endDate", ex.getMessage());
    }

    @Test
    void validateDateTimeRange_shouldAllowNullBounds() {
        LocalDateTime now = LocalDateTime.of(2025, 1, 1, 0, 0);

        assertDoesNotThrow(() -> helper.validateDateTimeRange(null, now, "startDate", "endDate"));
        assertDoesNotThrow(() -> helper.validateDateTimeRange(now, null, "startDate", "endDate"));
        assertDoesNotThrow(() -> helper.validateDateTimeRange(null, null, "startDate", "endDate"));
    }

    @Test
    void requireNonBlank_shouldRejectNullOrBlank() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.requireNonBlank(null, "supplierId"));
        assertEquals("supplierId must not be blank", ex.getMessage());

        ex = assertThrows(InvalidRequestException.class,
                () -> helper.requireNonBlank("   ", "supplierId"));
        assertEquals("supplierId must not be blank", ex.getMessage());
    }

    @Test
    void requireNonBlank_shouldAcceptNonBlank() {
        assertDoesNotThrow(() -> helper.requireNonBlank("s1", "supplierId"));
    }

    @Test
    void validateNumericRange_shouldRejectMinGreaterThanMax() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> helper.validateNumericRange(10, 5, "min", "max"));
        assertEquals("min must be <= max", ex.getMessage());
    }

    @Test
    void validateNumericRange_shouldAllowNullsAndValidRange() {
        assertDoesNotThrow(() -> helper.validateNumericRange(null, 5, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, null, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(null, null, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, 5, "min", "max"));
        assertDoesNotThrow(() -> helper.validateNumericRange(5, 6, "min", "max"));
    }

    @Test
    void applyDefaultDateWindow_shouldDefaultLast30DaysWhenBothNull() {
        LocalDateTime[] window = helper.applyDefaultDateWindow(null, null);

        assertNotNull(window);
        assertEquals(2, window.length);
        assertNotNull(window[0]);
        assertNotNull(window[1]);

        assertEquals(window[1], window[0].plusDays(30));
    }

    @Test
    void applyDefaultDateWindow_shouldNotChangeIfEitherDateProvided() {
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
    void validateStockUpdateFilter_shouldValidateDateTimeAndNumericRanges() {
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
    void buildFilter_populatesAllFields() {
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
    void buildFilter_allowsNullFields() {
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
