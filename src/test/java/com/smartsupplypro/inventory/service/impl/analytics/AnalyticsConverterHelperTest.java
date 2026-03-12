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
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * # AnalyticsConverterHelperTest
 *
 * Unit tests for {@link AnalyticsConverterHelper}.
 *
 * <p><strong>Purpose</strong></p>
 * Validate the small but critical conversion/validation utilities that sit underneath
 * analytics services. These helpers are often exercised indirectly via service tests,
 * but direct unit coverage is valuable because the input types can vary by database
 * vendor and query shape.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>Date conversions: {@code LocalDate/java.sql.Date/Timestamp/String}-like values</li>
 *   <li>Timestamp conversions: {@code LocalDateTime/Timestamp}</li>
 *   <li>Numeric coercion: {@code null/Number/BigDecimal} and fail-fast for invalid types</li>
 *   <li>Date-window defaulting + validation (start <= end)</li>
 *   <li>String normalization and parameter precondition checks</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Keep assertions stable: avoid brittle exact matching on {@code LocalDate.now()} defaults.</li>
 *   <li>Prefer explicit throwable assertions (type + message) where messages are part of contract.</li>
 * </ul>
 */
class AnalyticsConverterHelperTest {

    @Test
    void asLocalDate_supportsLocalDateSqlDateTimestampAndCharSequence() {
        // GIVEN
        LocalDate d = LocalDate.parse("2024-02-01");

        // WHEN/THEN
        assertEquals(d, AnalyticsConverterHelper.asLocalDate(d));
        assertEquals(d, AnalyticsConverterHelper.asLocalDate(java.sql.Date.valueOf(d)));
        assertEquals(d, AnalyticsConverterHelper.asLocalDate(Timestamp.valueOf(LocalDateTime.of(d, LocalTime.NOON))));
        assertEquals(d, AnalyticsConverterHelper.asLocalDate("2024-02-01 00:00:00.0"));
    }

    @Test
    void asLocalDate_fallsBackToToStringWhenLooksLikeIsoDatePrefix() {
        // GIVEN: an object with an ISO-like string prefix "yyyy-MM-dd"
        Object o = new Object() {
            @Override public String toString() {
                return "2024-02-01T10:00:00";
            }
        };

        // WHEN/THEN
        assertEquals(LocalDate.parse("2024-02-01"), AnalyticsConverterHelper.asLocalDate(o));
    }

    @Test
    void asLocalDate_throwsForUnsupportedType() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> AnalyticsConverterHelper.asLocalDate(123));
        assertNotNull(ex.getMessage());
    }

    @Test
    void asLocalDateTime_supportsLocalDateTimeAndTimestamp() {
        // GIVEN
        LocalDateTime ldt = LocalDateTime.parse("2024-02-01T10:00:00");

        // WHEN/THEN
        assertEquals(ldt, AnalyticsConverterHelper.asLocalDateTime(ldt));
        assertEquals(ldt, AnalyticsConverterHelper.asLocalDateTime(Timestamp.valueOf(ldt)));
    }

    @Test
    void asLocalDateTime_throwsForUnsupportedType() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> AnalyticsConverterHelper.asLocalDateTime("2024-02-01"));
        assertNotNull(ex.getMessage());
    }

    @Test
    void asNumber_treatsNullAsZero_andSupportsNumberAndBigDecimal() {
        // null is treated as 0 to simplify aggregation logic
        assertEquals(BigDecimal.ZERO, (BigDecimal) AnalyticsConverterHelper.asNumber(null));

        assertEquals(3L, AnalyticsConverterHelper.asNumber(3L).longValue());
        assertEquals(5L, AnalyticsConverterHelper.asNumber(new BigDecimal("5")).longValue());
    }

    @Test
    void asNumber_throwsForUnsupportedType() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> AnalyticsConverterHelper.asNumber("not-a-number"));
        assertNotNull(ex.getMessage());
    }

    @Test
    void defaultAndValidateDateWindow_appliesDefaultsAndValidates() {
        // GIVEN/WHEN: both null triggers defaults (relative to now)
        LocalDate[] out = AnalyticsConverterHelper.defaultAndValidateDateWindow(null, null);

        // THEN: avoid brittle equality around midnight; validate relative relationship instead
        assertFalse(out[0].isAfter(out[1]), "start must be <= end");
        long days = ChronoUnit.DAYS.between(out[0], out[1]);
        assertTrue(days == 30 || days == 31, () -> "Expected ~30-day window but was " + days + " days");

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
            () -> AnalyticsConverterHelper.defaultAndValidateDateWindow(LocalDate.parse("2024-03-02"), LocalDate.parse("2024-03-01")));
        assertEquals("start must be on or before end", ex.getMessage());
    }

    @Test
    void startOfDayAndEndOfDay_useExpectedTimeBoundaries() {
        LocalDate d = LocalDate.parse("2024-02-01");
        assertEquals(LocalDateTime.of(d, LocalTime.MIN), AnalyticsConverterHelper.startOfDay(d));
        assertEquals(LocalDateTime.of(d, LocalTime.MAX), AnalyticsConverterHelper.endOfDay(d));
    }

    @Test
    void blankToNull_normalizesAndTrims() {
        assertNull(AnalyticsConverterHelper.blankToNull(null));
        assertNull(AnalyticsConverterHelper.blankToNull("  \t  "));
        assertEquals("abc", AnalyticsConverterHelper.blankToNull("  abc  "));
    }

    @Test
    void requireNonBlank_andRequireNonNull_enforcePreconditions() {
        InvalidRequestException nonBlankEx = assertThrows(InvalidRequestException.class,
            () -> AnalyticsConverterHelper.requireNonBlank("   ", "q"));
        assertEquals("q must not be blank", nonBlankEx.getMessage());
        assertEquals("x", AnalyticsConverterHelper.requireNonBlank("  x  ", "q"));

        Object o = new Object();
        assertSame(o, AnalyticsConverterHelper.requireNonNull(o, "o"));
        InvalidRequestException nonNullEx = assertThrows(InvalidRequestException.class,
            () -> AnalyticsConverterHelper.requireNonNull(null, "o"));
        assertEquals("o must not be null", nonNullEx.getMessage());
    }
}
