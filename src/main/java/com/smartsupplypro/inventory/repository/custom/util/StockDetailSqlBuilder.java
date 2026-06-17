package com.smartsupplypro.inventory.repository.custom.util;

/**
 * SQL factory for {@code StockDetailQueryRepositoryImpl} — produces filtered search queries for H2 and Oracle.
 */
public final class StockDetailSqlBuilder {

    private StockDetailSqlBuilder() {}

    /**
     * Returns the H2 SQL for multi-criteria filtered stock history search.
     *
     * <p>Uses {@code UPPER()} for case-insensitive supplier ID comparison (H2 requires explicit casing).
     *
     * @return parameterised SQL string with named parameters
     */
    public static String buildH2FilteredSearchSql() {
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
              AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
              AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
              AND (:minChange IS NULL OR sh.quantity_change >= :minChange)
              AND (:maxChange IS NULL OR sh.quantity_change <= :maxChange)
            ORDER BY sh.created_at DESC
        """;
    }

    /**
     * Returns the Oracle SQL for multi-criteria filtered stock history search.
     *
     * <p>Omits {@code UPPER()} on the supplier FK column; Oracle stores IDs case-sensitively
     * and an uppercase comparison would bypass any function-based index.
     *
     * @return parameterised SQL string with named parameters
     */
    public static String buildOracleFilteredSearchSql() {
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
            ORDER BY sh.created_at DESC
        """;
    }
}
