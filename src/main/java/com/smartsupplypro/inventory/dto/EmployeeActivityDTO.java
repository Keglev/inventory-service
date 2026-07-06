package com.smartsupplypro.inventory.dto;

/**
 * Change activity of one employee inside one time bucket.
 *
 * <p>{@code period} format depends on the requested granularity:
 * daily {@code YYYY-MM-DD}, weekly ISO {@code YYYY-Www}, monthly {@code YYYY-MM}.
 * {@code createdBy} is the stable audit identity (the OAuth principal email);
 * {@code displayName} is resolved from the user table with the email as fallback.</p>
 *
 * @param period      time bucket label
 * @param createdBy   audit identity (email) recorded on the stock history rows
 * @param displayName human-readable name for charts and tables
 * @param changeCount number of stock changes in the bucket
 */
public record EmployeeActivityDTO(
        String period,
        String createdBy,
        String displayName,
        long changeCount
) {}
