package com.smartsupplypro.inventory.dto;

/**
 * Aggregated stock movement per stock-change reason.
 *
 * <p>Quantities are sign-split at aggregation time: {@code increase} sums positive
 * quantity changes, {@code decrease} sums the absolute value of negative changes.
 * A reason can therefore contribute to both sides (e.g. MANUAL_UPDATE corrections).</p>
 *
 * @param reason   stock change reason name (enum string)
 * @param increase total units added under this reason (sum of positive changes)
 * @param decrease total units removed under this reason (absolute sum of negative changes)
 */
public record ReasonBreakdownDTO(
        String reason,
        long increase,
        long decrease
) {}
