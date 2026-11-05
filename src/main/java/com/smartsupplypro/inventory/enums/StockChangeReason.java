package com.smartsupplypro.inventory.enums;

/**
 * Categorizes the reason for a stock quantity or value change, used in stock history tracking.
 */
public enum StockChangeReason {

    /** Opening stock of a new item; also offered for a restock in the quantity adjust dialog. */
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
