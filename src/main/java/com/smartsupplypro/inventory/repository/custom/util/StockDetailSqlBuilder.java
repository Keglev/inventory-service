package com.smartsupplypro.inventory.repository.custom.util;

/**
 * SQL factory for {@code StockDetailQueryRepositoryImpl} — produces the filtered stock history search.
 *
 * <p>One statement serves H2 (Oracle mode, unquoted identifiers upper-cased) and Oracle, so the
 * tests run the exact text production runs.
 */
public final class StockDetailSqlBuilder {

    private StockDetailSqlBuilder() {}

    /**
     * Returns the SQL for multi-criteria filtered stock history search.
     *
     * <p>The supplier FK is compared without {@code UPPER()}: Oracle stores IDs case-sensitively
     * and an uppercase comparison would bypass any index on the column.
     *
     * @return parameterised SQL string with named parameters
     */
    public static String buildFilteredSearchSql() {
        return """
            SELECT i.name AS item_name,
                   s.name AS supplier_name,
                   sh.quantity_change,
                   sh.reason,
                   sh.created_by,
                   sh.created_at
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            JOIN supplier s ON i.supplier_id = s.id
            WHERE (:startDate IS NULL OR sh.created_at >= :startDate)
              AND (:endDate IS NULL OR sh.created_at <= :endDate)
              AND (:itemPattern IS NULL OR LOWER(i.name) LIKE :itemPattern)
              AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
              AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
              AND (:minChange IS NULL OR sh.quantity_change >= :minChange)
              AND (:maxChange IS NULL OR sh.quantity_change <= :maxChange)
            ORDER BY sh.created_at DESC, sh.id DESC
        """;
    }
}
