package com.smartsupplypro.inventory.repository.custom.util;

/**
 * SQL factory for {@code StockTrendAnalyticsRepositoryImpl} — produces time-series analytics queries for H2 and Oracle.
 */
public final class StockTrendSqlBuilder {

    private StockTrendSqlBuilder() {}

    /**
     * Returns the H2 SQL for monthly stock-in/stock-out aggregations.
     *
     * <p>Uses {@code YEAR()}/{@code MONTH()} and {@code LPAD()} for YYYY-MM formatting;
     * optionally joins inventory_item for supplier filtering.
     *
     * @param withSupplierFilter when true, adds a JOIN and {@code :supplierId} filter
     * @return SQL ordered by month ascending; always accepts {@code :start} and {@code :end}
     */
    public static String buildH2MonthlyMovementSql(boolean withSupplierFilter) {
        final String baseQuery = """
            SELECT CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                          LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0')) AS month_str,
                   SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                   SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
            FROM stock_history sh
            %s
            WHERE sh.created_at BETWEEN :start AND :end
            %s
            GROUP BY CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'))
            ORDER BY 1
        """;
        final String join = withSupplierFilter ? "JOIN inventory_item i ON sh.item_id = i.id" : "";
        final String filter = withSupplierFilter
            ? "AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))" : "";
        return String.format(baseQuery, join, filter);
    }

    /**
     * Returns the Oracle SQL for monthly stock-in/stock-out aggregations.
     *
     * <p>Uses {@code TO_CHAR(..., 'YYYY-MM')} for month formatting.
     *
     * @param withSupplierFilter when true, adds a JOIN and {@code :supplierId} filter
     * @return SQL ordered by month ascending; always accepts {@code :start} and {@code :end}
     */
    public static String buildOracleMonthlyMovementSql(boolean withSupplierFilter) {
        final String baseQuery = """
            SELECT TO_CHAR(sh.created_at, 'YYYY-MM') AS month_str,
                   SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                   SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
            FROM stock_history sh
            %s
            WHERE sh.created_at BETWEEN :start AND :end
            %s
            GROUP BY TO_CHAR(sh.created_at, 'YYYY-MM')
            ORDER BY 1
        """;
        final String join = withSupplierFilter ? "JOIN inventory_item i ON sh.item_id = i.id" : "";
        final String filter = withSupplierFilter
            ? "AND (:supplierId IS NULL OR i.supplier_id = :supplierId)" : "";
        return String.format(baseQuery, join, filter);
    }

    /**
     * Returns the H2 SQL for daily inventory valuation (quantity × price per day).
     *
     * <p>Uses a CTE with {@code SUM() OVER} window function to compute running quantity;
     * {@code ROW_NUMBER()} selects the closing value per item per day.
     *
     * @return SQL ordered by day ascending; accepts {@code :start}, {@code :end}, {@code :supplierId}
     */
    public static String buildH2DailyValuationSql() {
        return """
            WITH events AS (
                SELECT
                    CAST(sh.created_at AS DATE) AS day_date,
                    sh.item_id,
                    sh.created_at,
                    sh.quantity_change,
                    sh.price_at_change,
                    SUM(sh.quantity_change) OVER (
                        PARTITION BY sh.item_id
                        ORDER BY sh.created_at
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) AS qty_after,
                    ROW_NUMBER() OVER (
                        PARTITION BY CAST(sh.created_at AS DATE), sh.item_id
                        ORDER BY sh.created_at DESC
                    ) AS rn
                FROM stock_history sh
                JOIN inventory_item i ON i.id = sh.item_id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            )
            SELECT
                e.day_date,
                SUM(COALESCE(e.qty_after, 0) * COALESCE(e.price_at_change, i.price, 0)) AS total_value
            FROM events e
            JOIN inventory_item i ON i.id = e.item_id
            WHERE e.rn = 1
            GROUP BY e.day_date
            ORDER BY e.day_date
        """;
    }

    /**
     * Returns the Oracle SQL for daily inventory valuation (quantity × price per day).
     *
     * <p>Uses {@code TRUNC()} instead of {@code CAST(... AS DATE)} for day truncation.
     *
     * @return SQL ordered by day ascending; accepts {@code :start}, {@code :end}, {@code :supplierId}
     */
    public static String buildOracleDailyValuationSql() {
        return """
            WITH events AS (
                SELECT
                    CAST(TRUNC(sh.created_at) AS DATE) AS day_date,
                    sh.item_id,
                    sh.created_at,
                    sh.quantity_change,
                    sh.price_at_change,
                    SUM(sh.quantity_change) OVER (
                        PARTITION BY sh.item_id
                        ORDER BY sh.created_at
                    ) AS qty_after,
                    ROW_NUMBER() OVER (
                        PARTITION BY TRUNC(sh.created_at), sh.item_id
                        ORDER BY sh.created_at DESC
                    ) AS rn
                FROM stock_history sh
                JOIN inventory_item i ON i.id = sh.item_id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
            )
            SELECT
                e.day_date,
                SUM(COALESCE(e.qty_after, 0) * COALESCE(e.price_at_change, i.price, 0)) AS total_value
            FROM events e
            JOIN inventory_item i ON i.id = e.item_id
            WHERE e.rn = 1
            GROUP BY e.day_date
            ORDER BY e.day_date
        """;
    }

    /**
     * Returns the H2 SQL for daily average price trend of a specific item.
     *
     * <p>Uses {@code YEAR()}/{@code MONTH()}/{@code DAY()} with {@code LPAD()} for YYYY-MM-DD formatting.
     *
     * @return SQL ordered by day ascending; accepts {@code :start}, {@code :end}, {@code :itemId}, {@code :supplierId}
     */
    public static String buildH2PriceTrendSql() {
        return """
            SELECT CONCAT(
                       CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                       LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'), '-',
                       LPAD(CAST(DAY(sh.created_at) AS VARCHAR), 2, '0')
                   ) AS day_str,
                   AVG(sh.price_at_change) AS price
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE sh.created_at BETWEEN :start AND :end
              AND sh.item_id = :itemId
              AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            GROUP BY CONCAT(
                       CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                       LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'), '-',
                       LPAD(CAST(DAY(sh.created_at) AS VARCHAR), 2, '0')
                   )
            ORDER BY 1
        """;
    }

    /**
     * Returns the Oracle SQL for daily average price trend of a specific item.
     *
     * <p>Uses {@code TO_CHAR(..., 'YYYY-MM-DD')} for day formatting.
     *
     * @return SQL ordered by day ascending; accepts {@code :start}, {@code :end}, {@code :itemId}, {@code :supplierId}
     */
    public static String buildOraclePriceTrendSql() {
        return """
            SELECT TO_CHAR(sh.created_at, 'YYYY-MM-DD') AS day_str,
                   AVG(sh.price_at_change) AS price
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE sh.created_at BETWEEN :start AND :end
              AND sh.item_id = :itemId
              AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
            GROUP BY TO_CHAR(sh.created_at, 'YYYY-MM-DD')
            ORDER BY 1
        """;
    }
}
