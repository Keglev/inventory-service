package com.smartsupplypro.inventory.repository.custom.util;

/**
 * SQL factory for {@code StockMetricsRepositoryImpl} — produces KPI and threshold queries for H2 and Oracle.
 */
public final class StockMetricsSqlBuilder {

    private StockMetricsSqlBuilder() {}

    /**
     * Returns the H2 SQL for total stock quantity per supplier.
     *
     * <p>Quotes identifiers with double-quotes required by H2's default case-sensitive mode.
     *
     * @return SQL ordered by total_quantity descending
     */
    public static String buildH2SupplierTotalsSql() {
        return """
            SELECT s."NAME" AS supplier_name, SUM(i."QUANTITY") AS total_quantity
            FROM "SUPPLIER" s
            JOIN "INVENTORY_ITEM" i ON s."ID" = i."SUPPLIER_ID"
            GROUP BY s."NAME"
            ORDER BY total_quantity DESC
        """;
    }

    /**
     * Returns the Oracle SQL for total stock quantity per supplier.
     *
     * @return SQL ordered by total_quantity descending
     */
    public static String buildOracleSupplierTotalsSql() {
        return """
            SELECT s.name AS supplier_name, SUM(i.quantity) AS total_quantity
            FROM supplier s
            JOIN inventory_item i ON s.id = i.supplier_id
            GROUP BY s.name
            ORDER BY total_quantity DESC
        """;
    }

    /**
     * Returns the H2 SQL for update event count per item with optional supplier filter.
     *
     * @return SQL ordered by update_count descending; accepts named parameter {@code :supplierId}
     */
    public static String buildH2UpdateCountSql() {
        return """
            SELECT i."NAME" AS item_name, COUNT(sh."ID") AS update_count
            FROM "INVENTORY_ITEM" i
            JOIN "STOCK_HISTORY" sh ON sh."ITEM_ID" = i."ID"
            WHERE (:supplierId IS NULL OR UPPER(i."SUPPLIER_ID") = UPPER(:supplierId))
            GROUP BY i."NAME"
            ORDER BY update_count DESC
        """;
    }

    /**
     * Returns the Oracle SQL for update event count per item with optional supplier filter.
     *
     * @return SQL ordered by update_count descending; accepts named parameter {@code :supplierId}
     */
    public static String buildOracleUpdateCountSql() {
        return """
            SELECT i.name AS item_name, COUNT(sh.id) AS update_count
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            GROUP BY i.name
            ORDER BY update_count DESC
        """;
    }

    /**
     * Returns the H2 SQL for items currently below their minimum stock threshold.
     *
     * @return SQL ordered by quantity ascending; accepts named parameter {@code :supplierId}
     */
    public static String buildH2BelowMinimumSql() {
        return """
            SELECT i."NAME", i."QUANTITY", i."MINIMUM_QUANTITY"
            FROM "INVENTORY_ITEM" i
            WHERE i."QUANTITY" < i."MINIMUM_QUANTITY"
              AND (:supplierId IS NULL OR UPPER(i."SUPPLIER_ID") = UPPER(:supplierId))
            ORDER BY i."QUANTITY" ASC
        """;
    }

    /**
     * Returns the Oracle SQL for items currently below their minimum stock threshold.
     *
     * @return SQL ordered by quantity ascending; accepts named parameter {@code :supplierId}
     */
    public static String buildOracleBelowMinimumSql() {
        return """
            SELECT i.name, i.quantity, i.minimum_quantity
            FROM inventory_item i
            WHERE i.quantity < i.minimum_quantity
              AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            ORDER BY i.quantity ASC
        """;
    }
}
