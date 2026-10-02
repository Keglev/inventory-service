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
    RETURNED_BY_CUSTOMER
}
