package com.smartsupplypro.inventory.service.impl.analytics;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Type-conversion utilities for analytics native SQL projections.
 *
 * <p>Handles vendor differences between H2 (test) and Oracle (prod) by
 * accepting multiple date/numeric types from {@code Object[]} projections
 * and coercing them to standard Java types.</p>
 */
final class AnalyticsConverterHelper {

    private AnalyticsConverterHelper() {}

    // ── Date/Time conversions ─────────────────────────────────────────────────

    /**
     * Converts a date-like projection value to {@link LocalDate}.
     * Accepts {@code LocalDate}, {@code java.sql.Date}, {@code java.sql.Timestamp},
     * and {@code CharSequence} values starting with {@code yyyy-MM-dd}.
     *
     * @param o raw value from a native projection
     * @return corresponding {@link LocalDate}
     * @throws IllegalStateException if the value cannot be interpreted as a date
     */
    static LocalDate asLocalDate(Object o) {
        if (o instanceof LocalDate ld) return ld;
        if (o instanceof java.sql.Date d) return d.toLocalDate();
        if (o instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();

        if (o instanceof CharSequence cs) {
            String s = cs.toString();
            if (s.length() >= 10) return LocalDate.parse(s.substring(0, 10));
        }

        // Last resort: toString() on timestamp literals from H2 (e.g. "2025-03-15 00:00:00.0")
        String s = String.valueOf(o);
        if (s.length() >= 10 && s.charAt(4) == '-' && s.charAt(7) == '-') {
            return LocalDate.parse(s.substring(0, 10));
        }

        throw new IllegalStateException("Expected LocalDate/Date/Timestamp/String but got: " +
                (o == null ? "null" : o.getClass().getName() + " -> " + o));
    }

    /**
     * Converts a timestamp-like projection value to {@link LocalDateTime}.
     *
     * @param o timestamp value ({@code LocalDateTime} or {@code java.sql.Timestamp})
     * @return corresponding {@link LocalDateTime}
     * @throws IllegalStateException if the object type is unsupported
     */
    static LocalDateTime asLocalDateTime(Object o) {
        if (o instanceof LocalDateTime ldt) return ldt;
        if (o instanceof Timestamp ts) return ts.toLocalDateTime();
        throw new IllegalStateException("Expected LocalDateTime or java.sql.Timestamp but got: " + o);
    }

    /**
     * Safely unboxes any numeric projection value via {@link Number}.
     * Null is treated as zero to avoid NPEs in aggregation results.
     *
     * @param o numeric value (null, {@link Number}, or {@link java.math.BigDecimal})
     * @return corresponding {@link Number}
     */
    static Number asNumber(Object o) {
        if (o == null) return java.math.BigDecimal.ZERO;
        if (o instanceof Number n) return n;
        if (o instanceof java.math.BigDecimal bd) return bd;
        throw new IllegalStateException("Expected numeric type but got: " + o);
    }

    // ── Date window utilities ─────────────────────────────────────────────────

    /**
     * Applies a 30-day default window when bounds are null and validates {@code start <= end}.
     *
     * @param start nullable inclusive start date
     * @param end   nullable inclusive end date
     * @return 2-element array {@code [effectiveStart, effectiveEnd]}
     * @throws InvalidRequestException if effective start is after effective end
     */
    static LocalDate[] defaultAndValidateDateWindow(LocalDate start, LocalDate end) {
        LocalDate s = (start == null) ? LocalDate.now().minusDays(30) : start;
        LocalDate e = (end == null) ? LocalDate.now() : end;
        if (s.isAfter(e)) {
            throw new InvalidRequestException("start must be on or before end");
        }
        return new LocalDate[]{s, e};
    }

    /** Returns the start-of-day boundary (00:00:00) for the given date (inclusive lower bound). */
    static LocalDateTime startOfDay(LocalDate d) {
        return LocalDateTime.of(d, LocalTime.MIN);
    }

    /** Returns the end-of-day boundary (23:59:59.999…) for the given date (inclusive upper bound). */
    static LocalDateTime endOfDay(LocalDate d) {
        return LocalDateTime.of(d, LocalTime.MAX);
    }

    // ── String utilities ──────────────────────────────────────────────────────

    /**
     * Returns null if the string is blank, otherwise a trimmed value.
     * Used to normalize optional filter parameters before passing to repository queries.
     */
    static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }

    /**
     * Returns the trimmed value or throws if the string is blank.
     * @throws InvalidRequestException if value is blank
     */
    static String requireNonBlank(String v, String name) {
        if (v == null || v.trim().isEmpty()) {
            throw new InvalidRequestException(name + " must not be blank");
        }
        return v.trim();
    }

    /**
     * Returns the value or throws if null.
     * @throws InvalidRequestException if value is null
     */
    static <T> T requireNonNull(T v, String name) {
        if (v == null) {
            throw new InvalidRequestException(name + " must not be null");
        }
        return v;
    }
}
