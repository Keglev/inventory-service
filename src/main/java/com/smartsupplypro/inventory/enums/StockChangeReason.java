package com.smartsupplypro.inventory.enums;

/**
 * Enum representing the reason for a stock quantity change.
 *
 * <p>Used in inventory history, analytics, and auditing to explain
 * why stock was added or removed. Helps ensure traceability and consistency
 * across all stock movement entries.
 *
 * <p>This enum is used in:
 * <ul>
 *   <li>{@code StockHistoryDTO.reason}</li>
 *   <li>{@code InventoryItemService.delete(..., reason)}</li>
 *   <li>Filtering in analytics/reporting</li>
 * </ul>
 */
public enum StockChangeReason {

    /** Initial quantity entered when item is first added to inventory. */
    INITIAL_STOCK,

    /** Manual correction performed by a user (e.g., discrepancy fix). */
    MANUAL_UPDATE,

    /** manual correction performed by a user (e.g., new prices) */
    PRICE_CHANGE,

    /** Stock was sold to a customer (outbound). */
    SOLD,

    /** Item was scrapped due to damage, policy, or internal decision. */
    SCRAPPED,

    /** Item was destroyed beyond use (e.g., fire, critical damage). */
    DESTROYED,

    /** Item is damaged but not yet scrapped or returned. */
    DAMAGED,

    /** Item has passed its expiration date and is no longer sellable. */
    EXPIRED,

    /** Item is missing or lost during handling, shipping, or storage. */
    LOST,

    /** Stock was returned back to the supplier (e.g., defective goods). */
    RETURNED_TO_SUPPLIER,

    /** Stock was returned by the customer (e.g., refund, exchange). */
    RETURNED_BY_CUSTOMER
}

