package com.smartsupplypro.inventory.enums;

/**
 * Categorizes the reason for a stock quantity or value change, used in stock history tracking.
 */
public enum StockChangeReason {

    /* Initial stock entry. In this app is used also when reposing old stock */
    INITIAL_STOCK,
    MANUAL_UPDATE,
    /** Price-only correction; does not affect available quantity. */
    PRICE_CHANGE,
    SOLD,
    SCRAPPED,
    DESTROYED,
    DAMAGED,
    EXPIRED,
    LOST,
    RETURNED_TO_SUPPLIER,
    RETURNED_BY_CUSTOMER;

    /**
     * Parses a case-insensitive string to the matching {@code StockChangeReason} constant.
     *
     * @throws IllegalArgumentException if {@code value} is null, blank, or unrecognized
     */
    public static StockChangeReason fromString(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Stock change reason cannot be null or empty");
        }
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid stock change reason: " + value.trim(), e);
        }
    }
}
