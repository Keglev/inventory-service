package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Unit tests for {@link AnalyticsConverterHelper} conversion and validation utilities
 * covering date, timestamp, numeric, and window-defaulting behaviors.
 */
class AnalyticsConverterHelperTest {

    /**
     * Tests for {@code asLocalDate} and {@code asLocalDateTime} date conversion methods.
     */
    @Nested
    class DateConversion {

        @Test
        void should_return_a_local_date_when_given_a_local_date_sql_date_timestamp_or_string() {
            LocalDate d = LocalDate.parse("2024-02-01");
            assertEquals(d, AnalyticsConverterHelper.asLocalDate(d));
            assertEquals(d, AnalyticsConverterHelper.asLocalDate(java.sql.Date.valueOf(d)));
            assertEquals(d, AnalyticsConverterHelper.asLocalDate(Timestamp.valueOf(LocalDateTime.of(d, LocalTime.NOON))));
            assertEquals(d, AnalyticsConverterHelper.asLocalDate("2024-02-01 00:00:00.0"));
        }

        @Test
        void should_parse_the_iso_datetime_when_falling_back_to_to_string() {
            Object o = new Object() {
                @Override public String toString() { return "2024-02-01T10:00:00"; }
            };
            assertEquals(LocalDate.parse("2024-02-01"), AnalyticsConverterHelper.asLocalDate(o));
        }

        @Test
        void should_throw_when_the_date_type_is_unsupported() {
            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> AnalyticsConverterHelper.asLocalDate(123));
            assertNotNull(ex.getMessage());
        }

        @Test
        void should_convert_when_given_a_local_date_time_or_timestamp() {
            LocalDateTime ldt = LocalDateTime.parse("2024-02-01T10:00:00");
            assertEquals(ldt, AnalyticsConverterHelper.asLocalDateTime(ldt));
            assertEquals(ldt, AnalyticsConverterHelper.asLocalDateTime(Timestamp.valueOf(ldt)));
        }

        @Test
        void should_throw_when_the_datetime_type_is_unsupported() {
            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> AnalyticsConverterHelper.asLocalDateTime("2024-02-01"));
            assertNotNull(ex.getMessage());
        }
    }

    /**
     * Tests for {@code asNumber}.
     */
    @Nested
    class AsNumber {

        @Test
        void should_treat_null_as_zero_and_accept_number_and_big_decimal_when_coercing() {
            // null -> BigDecimal.ZERO to simplify aggregation
            assertEquals(BigDecimal.ZERO, (BigDecimal) AnalyticsConverterHelper.asNumber(null));
            assertEquals(3L, AnalyticsConverterHelper.asNumber(3L).longValue());
            assertEquals(5L, AnalyticsConverterHelper.asNumber(new BigDecimal("5")).longValue());
        }

        @Test
        void should_throw_when_the_numeric_type_is_unsupported() {
            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> AnalyticsConverterHelper.asNumber("not-a-number"));
            assertNotNull(ex.getMessage());
        }
    }

    /**
     * Tests for {@code defaultAndValidateDateWindow}, {@code startOfDay}, {@code endOfDay}.
     */
    @Nested
    class DateWindow {

        @Test
        void should_apply_30_day_default_window_when_both_dates_are_null() {
            LocalDate[] out = AnalyticsConverterHelper.defaultAndValidateDateWindow(null, null);
            assertFalse(out[0].isAfter(out[1]));
            long days = ChronoUnit.DAYS.between(out[0], out[1]);
            assertTrue(days == 30 || days == 31, () -> "Expected ~30-day window but was " + days);
        }

        @Test
        void should_throw_when_start_is_after_end() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> AnalyticsConverterHelper.defaultAndValidateDateWindow(
                            LocalDate.parse("2024-03-02"), LocalDate.parse("2024-03-01")));
            assertEquals("start must be on or before end", ex.getMessage());
        }

        @Test
        void should_use_midnight_and_end_of_day_when_building_a_date_window() {
            LocalDate d = LocalDate.parse("2024-02-01");
            assertEquals(LocalDateTime.of(d, LocalTime.MIN), AnalyticsConverterHelper.startOfDay(d));
            assertEquals(LocalDateTime.of(d, LocalTime.MAX), AnalyticsConverterHelper.endOfDay(d));
        }
    }

    /**
     * Tests for {@code blankToNull}, {@code requireNonBlank}, and {@code requireNonNull}.
     */
    @Nested
    class StringPreconditions {

        @Test
        void should_return_null_when_the_string_is_blank_or_null() {
            assertNull(AnalyticsConverterHelper.blankToNull(null));
            assertNull(AnalyticsConverterHelper.blankToNull("  \t  "));
            assertEquals("abc", AnalyticsConverterHelper.blankToNull("  abc  "));
        }

        @Test
        void should_enforce_non_blank_and_non_null_when_a_precondition_is_checked() {
            InvalidRequestException blankEx = assertThrows(InvalidRequestException.class,
                    () -> AnalyticsConverterHelper.requireNonBlank("   ", "q"));
            assertEquals("q must not be blank", blankEx.getMessage());
            assertEquals("x", AnalyticsConverterHelper.requireNonBlank("  x  ", "q"));

            Object o = new Object();
            assertSame(o, AnalyticsConverterHelper.requireNonNull(o, "o"));
            InvalidRequestException nullEx = assertThrows(InvalidRequestException.class,
                    () -> AnalyticsConverterHelper.requireNonNull(null, "o"));
            assertEquals("o must not be null", nullEx.getMessage());
        }
    }
}
