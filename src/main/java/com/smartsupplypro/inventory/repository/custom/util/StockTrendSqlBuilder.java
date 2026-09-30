package com.smartsupplypro.inventory.repository.custom.util;

/**
 * SQL factory for {@code StockTrendAnalyticsRepositoryImpl} — produces time-series analytics queries for H2 and Oracle.
 */
// SIZE WAIVER: 153 code lines against a 150 alarm, of which 109 are SQL inside
// text blocks. Splitting the file moves SQL between files without reducing it.
// Recorded in docs/backend/architecture/11-risks-technical-debt.md.
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
     * Returns the H2 SQL for daily item movements: per item and day, the day's net
     * quantity change and the unit price of the day's last event.
     *
     * <p>Reads the whole history up to {@code :end}, not a window: an item's quantity on
     * any day is the sum of all its changes since its INITIAL_STOCK entry, so the caller
     * needs the movements before the first day it values.
     *
     * @return SQL ordered by day, then item; accepts {@code :end}, {@code :supplierId}
     */
    public static String buildH2DailyItemMovementsSql() {
        return """
            WITH events AS (
                SELECT
                    sh.item_id,
                    CAST(sh.created_at AS DATE) AS day_date,
                    SUM(sh.quantity_change) OVER (
                        PARTITION BY sh.item_id, CAST(sh.created_at AS DATE)
                    ) AS net_change,
                    COALESCE(sh.price_at_change, i.price, 0) AS unit_price,
                    ROW_NUMBER() OVER (
                        PARTITION BY sh.item_id, CAST(sh.created_at AS DATE)
                        ORDER BY sh.created_at DESC, sh.id DESC
                    ) AS rn
                FROM stock_history sh
                JOIN inventory_item i ON i.id = sh.item_id
                WHERE sh.created_at <= :end
                  AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            )
            SELECT item_id, day_date, net_change, unit_price
            FROM events
            WHERE rn = 1
            ORDER BY day_date, item_id
        """;
    }

    /**
     * Returns the Oracle SQL for daily item movements: per item and day, the day's net
     * quantity change and the unit price of the day's last event.
     *
     * <p>Reads the whole history up to {@code :end}, not a window: an item's quantity on
     * any day is the sum of all its changes since its INITIAL_STOCK entry, so the caller
     * needs the movements before the first day it values.
     *
     * @return SQL ordered by day, then item; accepts {@code :end}, {@code :supplierId}
     */
    public static String buildOracleDailyItemMovementsSql() {
        return """
            WITH events AS (
                SELECT
                    sh.item_id,
                    CAST(TRUNC(sh.created_at) AS DATE) AS day_date,
                    SUM(sh.quantity_change) OVER (
                        PARTITION BY sh.item_id, CAST(TRUNC(sh.created_at) AS DATE)
                    ) AS net_change,
                    COALESCE(sh.price_at_change, i.price, 0) AS unit_price,
                    ROW_NUMBER() OVER (
                        PARTITION BY sh.item_id, CAST(TRUNC(sh.created_at) AS DATE)
                        ORDER BY sh.created_at DESC, sh.id DESC
                    ) AS rn
                FROM stock_history sh
                JOIN inventory_item i ON i.id = sh.item_id
                WHERE sh.created_at <= :end
                  AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
            )
            SELECT item_id, day_date, net_change, unit_price
            FROM events
            WHERE rn = 1
            ORDER BY day_date, item_id
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

    /**
     * Returns the H2 SQL for per-employee daily change counts.
     *
     * <p>Groups by creator and calendar day using YEAR/MONTH/DAY_OF_MONTH string
     * assembly (same technique as the monthly movement variant). Weekly and
     * monthly rollups happen in the service layer to avoid dialect-specific
     * week functions.
     *
     * @return SQL ordered by day then creator; accepts {@code :start} and {@code :end}
     */
    public static String buildH2DailyEmployeeActivitySql() {
        return """
            SELECT sh.created_by,
                   CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                          LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'), '-',
                          LPAD(CAST(DAY_OF_MONTH(sh.created_at) AS VARCHAR), 2, '0')) AS day_str,
                   COUNT(*) AS change_count
            FROM stock_history sh
            WHERE sh.created_at BETWEEN :start AND :end
              AND (:supplierId IS NULL OR sh.supplier_id = :supplierId)
            GROUP BY sh.created_by,
                     CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'), '-',
                            LPAD(CAST(DAY_OF_MONTH(sh.created_at) AS VARCHAR), 2, '0'))
            ORDER BY 2, 1
        """;
    }

    /**
     * Returns the Oracle SQL for per-employee daily change counts.
     *
     * <p>Uses {@code TO_CHAR(..., 'YYYY-MM-DD')} for day formatting.
     *
     * @return SQL ordered by day then creator; accepts {@code :start} and {@code :end}
     */
    public static String buildOracleDailyEmployeeActivitySql() {
        return """
            SELECT sh.created_by,
                   TO_CHAR(sh.created_at, 'YYYY-MM-DD') AS day_str,
                   COUNT(*) AS change_count
            FROM stock_history sh
            WHERE sh.created_at BETWEEN :start AND :end
              AND (:supplierId IS NULL OR sh.supplier_id = :supplierId)
            GROUP BY sh.created_by, TO_CHAR(sh.created_at, 'YYYY-MM-DD')
            ORDER BY 2, 1
        """;
    }
}
