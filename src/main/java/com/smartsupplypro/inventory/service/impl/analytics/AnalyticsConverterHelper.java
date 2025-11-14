package com.smartsupplypro.inventory.service.impl.analytics;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Type conversion utilities for analytics database projections.
 *
 * <p>Handles type coercion from native SQL queries (Object[] projections) to Java types,
 * accounting for vendor differences between H2 (test) and Oracle (prod).
 *
 * <p><strong>Supported Conversions</strong>:
 * <ul>
 *   <li>DATE/TIMESTAMP → LocalDate/LocalDateTime</li>
 *   <li>Numeric projections → Number (handles null as zero)</li>
 *   <li>String normalization (blank → null)</li>
 *   <li>Date window defaults (30-day lookback)</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
final class AnalyticsConverterHelper {

    private AnalyticsConverterHelper() {
        // Utility class - prevent instantiation
    }

    // ==================================================================================
    // Date/Time Conversions
    // ==================================================================================

    /**
     * Converts a date-like value to {@link LocalDate}.
     *
     * <p>Accepts:
     * <ul>
     *   <li>{@link LocalDate}</li>
     *   <li>{@link java.sql.Date} (converted via {@code toLocalDate()})</li>
     *   <li>{@link java.sql.Timestamp} (converted via {@code toLocalDateTime().toLocalDate()})</li>
     *   <li>{@link CharSequence} in formats starting with {@code yyyy-MM-dd}</li>
     * </ul>
     *
     * @param o raw value from native projections (DATE/TIMESTAMP/STRING)
     * @return the corresponding {@link LocalDate}
     * @throws IllegalStateException if the value cannot be interpreted as a date
     */
    static LocalDate asLocalDate(Object o) {
        if (o instanceof LocalDate ld) return ld;
        if (o instanceof java.sql.Date d) return d.toLocalDate();
        if (o instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();

        if (o instanceof CharSequence cs) {
            String s = cs.toString();
            if (s.length() >= 10) {
                // e.g. "2025-03-15 00:00:00.0" → "2025-03-15"
                return LocalDate.parse(s.substring(0, 10));
            }
        }

        // Last resort: try toString().substring(0,10) if it looks like a timestamp literal
        String s = String.valueOf(o);
        if (s != null && s.length() >= 10 && s.charAt(4) == '-' && s.charAt(7) == '-') {
            return LocalDate.parse(s.substring(0, 10));
        }

        throw new IllegalStateException("Expected LocalDate/Date/Timestamp/String but got: " +
                (o == null ? "null" : o.getClass().getName() + " -> " + o));
    }

    /**
     * Converts a timestamp-like object to {@link LocalDateTime}.
     *
     * @param o timestamp value (LocalDateTime or java.sql.Timestamp)
     * @return the corresponding {@link LocalDateTime}
     * @throws IllegalStateException if the object type is unsupported
     */
    static LocalDateTime asLocalDateTime(Object o) {
        if (o instanceof LocalDateTime ldt) return ldt;
        if (o instanceof Timestamp ts) return ts.toLocalDateTime();
        throw new IllegalStateException("Expected LocalDateTime or java.sql.Timestamp but got: " + o);
    }

    /**
     * Safely unboxes any numeric projection value via {@link Number}.
     *
     * @param o numeric value (null, Number, or BigDecimal)
     * @return the corresponding {@link Number} (null treated as zero)
     */
    static Number asNumber(Object o) {
        if (o == null) return java.math.BigDecimal.ZERO;
        if (o instanceof Number n) return n;
        if (o instanceof java.math.BigDecimal bd) return bd;
        throw new IllegalStateException("Expected numeric type but got: " + o);
    }

    // ==================================================================================
    // Date Window Utilities
    // ==================================================================================

    /**
     * Applies defaults for a date window (last 30 days ending today) and validates {@code start <= end}.
     *
     * @param start nullable inclusive start date
     * @param end nullable inclusive end date
     * @return a 2-element array containing the effective start and end
     * @throws InvalidRequestException if the effective start is after the effective end
     */
    static LocalDate[] defaultAndValidateDateWindow(LocalDate start, LocalDate end) {
        LocalDate s = (start == null) ? LocalDate.now().minusDays(30) : start;
        LocalDate e = (end == null) ? LocalDate.now() : end;
        if (s.isAfter(e)) {
            throw new InvalidRequestException("start must be on or before end");
        }
        return new LocalDate[]{s, e};
    }

    /**
     * Converts date to start of day (00:00:00.000000000).
     *
     * @param d the date
     * @return LocalDateTime at start of day
     */
    static LocalDateTime startOfDay(LocalDate d) {
        return LocalDateTime.of(d, LocalTime.MIN);
    }

    /**
     * Converts date to end of day (23:59:59.999999999).
     *
     * @param d the date
     * @return LocalDateTime at end of day
     */
    static LocalDateTime endOfDay(LocalDate d) {
        return LocalDateTime.of(d, LocalTime.MAX);
    }

    // ==================================================================================
    // String Utilities
    // ==================================================================================

    /**
     * Normalizes a String to {@code null} if blank; otherwise returns a trimmed value.
     *
     * @param s the string to normalize
     * @return null if blank, trimmed value otherwise
     */
    static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }

    /**
     * Ensures a String is non-blank; returns trimmed value or throws.
     *
     * @param v the value to check
     * @param name the parameter name for error message
     * @return trimmed non-blank value
     * @throws InvalidRequestException if value is blank
     */
    static String requireNonBlank(String v, String name) {
        if (v == null || v.trim().isEmpty()) {
            throw new InvalidRequestException(name + " must not be blank");
        }
        return v.trim();
    }

    /**
     * Ensures a reference is non-null; returns it or throws.
     *
     * @param v the value to check
     * @param name the parameter name for error message
     * @return the non-null value
     * @throws InvalidRequestException if value is null
     */
    static <T> T requireNonNull(T v, String name) {
        if (v == null) {
            throw new InvalidRequestException(name + " must not be null");
        }
        return v;
    }
}
