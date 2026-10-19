package com.smartsupplypro.inventory.repository.custom.util;

/**
 * SQL factory for {@code StockMetricsRepositoryImpl} — produces the KPI queries.
 *
 * <p>Each statement serves H2 (Oracle mode, unquoted identifiers upper-cased) and Oracle, so the
 * tests run the exact text production runs.
 */
public final class StockMetricsSqlBuilder {

    private StockMetricsSqlBuilder() {}

    /**
     * Returns the SQL for stock quantity and value per supplier over active items.
     *
     * @return SQL ordered by total_value descending, then supplier name
     */
    public static String buildSupplierTotalsSql() {
        return """
            SELECT s.name AS supplier_name,
                   SUM(i.quantity) AS total_quantity,
                   SUM(i.quantity * COALESCE(i.price, 0)) AS total_value
            FROM supplier s
            JOIN inventory_item i ON s.id = i.supplier_id
            WHERE i.active = 1
            GROUP BY s.name
            ORDER BY total_value DESC, supplier_name ASC
        """;
    }

    /**
     * Returns the SQL for update event count per item with optional supplier filter.
     *
     * @return SQL ordered by update_count descending; accepts named parameter {@code :supplierId}
     */
    public static String buildUpdateCountSql() {
        return """
            SELECT i.name AS item_name, COUNT(sh.id) AS update_count
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            GROUP BY i.name
            ORDER BY update_count DESC
        """;
    }
}
