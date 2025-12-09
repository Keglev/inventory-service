/**
 * @file useAnalyticsData.ts
 * @module api/analytics/hooks
 *
 * @summary
 * Centralized data fetching hooks for analytics queries.
 * Provides reusable React Query hooks for dashboards, charts, and reports.
 * Moved from page layer to API layer for proper architectural separation.
 *
 * @enterprise
 * - Consistent caching strategy: 5-minute cache for analytics data
 * - Performance optimized with conditional enabling
 * - Error handling with graceful fallbacks
 * - Full parameter validation before API calls
 * - Comprehensive TypeDoc documentation for all hooks
 *
 * @usage
 * ```typescript
 * import { 
 *   useDashboardMetrics, 
 *   useStockValueQuery, 
 *   usePriceTrendQuery 
 * } from '@/api/analytics/hooks';
 * 
 * const metricsQuery = useDashboardMetrics(enabled);
 * const stockQuery = useStockValueQuery({ from: '2025-01-01', to: '2025-12-31' });
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { getInventoryCount, getSuppliersCount, getLowStockCount } from '../index';
import {
  getStockValueOverTime,
  getMonthlyStockMovement,
  getStockPerSupplier,
  getPriceTrend,
  getFinancialSummary,
  getItemUpdateFrequency,
  getLowStockItems,
} from '../index';
import type { AnalyticsParams, PriceTrendParams, StockMovementParams, FinancialSummaryParams } from '../validation';

/**
 * Hook to load dashboard KPI metrics (inventory count, supplier count, low stock count).
 * Caches results for 5 minutes.
 *
 * @param enabled - Whether to fetch (defaults to true, typically tied to page visibility)
 * @returns React Query result with KPI metrics object
 *
 * @enterprise
 * - Only fetches when enabled (performance optimization)
 * - 5-minute cache reduces backend load
 * - Automatically handles loading and error states
 * - Returns graceful null values on error (no breaking)
 *
 * @example
 * ```typescript
 * const { data: metrics, isLoading } = useDashboardMetrics();
 *
 * return (
 *   <>
 *     <StatCard title="Items" value={metrics?.inventoryCount} loading={isLoading} />
 *     <StatCard title="Suppliers" value={metrics?.suppliersCount} loading={isLoading} />
 *     <StatCard title="Low Stock" value={metrics?.lowStockCount} loading={isLoading} />
 *   </>
 * );
 * ```
 */
export function useDashboardMetrics(enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'dashboard-metrics'],
    queryFn: async () => {
      const [inventoryCount, suppliersCount, lowStockCount] = await Promise.all([
        getInventoryCount(),
        getSuppliersCount(),
        getLowStockCount(),
      ]);

      return {
        inventoryCount,
        suppliersCount,
        lowStockCount,
      };
    },
    enabled,
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 15 * 60_000,   // 15 minutes (formerly cacheTime)
  });
}

/**
 * Hook to load stock value over time (trend chart data).
 * Caches results for 5 minutes.
 *
 * @param params - Date range and optional supplier filter
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with stock value points
 *
 * @example
 * ```typescript
 * const { data: points, isLoading } = useStockValueQuery({
 *   from: '2025-09-01',
 *   to: '2025-11-30',
 *   supplierId: 'SUP-001'
 * });
 *
 * return <LineChart data={points} loading={isLoading} />;
 * ```
 */
export function useStockValueQuery(params: AnalyticsParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'stock-value', params],
    queryFn: () => getStockValueOverTime(params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load monthly stock movement (inbound/outbound).
 * Useful for trend analysis and planning.
 *
 * @param params - Date range and optional supplier filter
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with monthly movement data
 *
 * @example
 * ```typescript
 * const { data: movements } = useMonthlyMovementQuery({
 *   from: '2025-09-01',
 *   to: '2025-11-30'
 * });
 *
 * return <BarChart data={movements} />;
 * ```
 */
export function useMonthlyMovementQuery(params: StockMovementParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'monthly-movement', params],
    queryFn: () => getMonthlyStockMovement(params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load current stock distribution per supplier.
 * Useful for supplier-level analytics and reporting.
 *
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with per-supplier stock totals
 *
 * @example
 * ```typescript
 * const { data: distribution } = useStockPerSupplierQuery();
 *
 * return <DoughnutChart data={distribution} />;
 * ```
 */
export function useStockPerSupplierQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'stock-per-supplier'],
    queryFn: () => getStockPerSupplier(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load price trend for a specific item.
 * Shows historical price changes over time.
 *
 * @param params - Item ID, date range, optional supplier filter
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with price points
 *
 * @example
 * ```typescript
 * const { data: prices } = usePriceTrendQuery({
 *   itemId: 'ITEM-123',
 *   start: '2025-09-01',
 *   end: '2025-11-30'
 * });
 *
 * return <LineChart data={prices} />;
 * ```
 */
export function usePriceTrendQuery(params: PriceTrendParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'price-trend', params],
    queryFn: () => getPriceTrend(params.itemId, params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load financial summary with WAC calculations.
 * Shows cost-based inventory metrics.
 *
 * @param params - Date range and optional supplier filter
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with financial summary
 *
 * @example
 * ```typescript
 * const { data: summary } = useFinancialSummaryQuery({
 *   from: '2025-09-01',
 *   to: '2025-11-30'
 * });
 *
 * return <FinancialDashboard data={summary} />;
 * ```
 */
export function useFinancialSummaryQuery(params: FinancialSummaryParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'financial-summary', params],
    queryFn: () => getFinancialSummary(params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load item update frequency for a supplier.
 * Shows which items are modified most frequently.
 *
 * @param supplierId - Supplier to analyze
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with frequency data per item
 *
 * @example
 * ```typescript
 * const { data: frequencies } = useItemFrequencyQuery('SUP-001');
 *
 * return <Table data={frequencies} />;
 * ```
 */
export function useItemFrequencyQuery(supplierId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'item-frequency', supplierId],
    queryFn: () => getItemUpdateFrequency(supplierId),
    enabled: enabled && !!supplierId,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load items below minimum stock threshold.
 * Useful for inventory planning and alerts.
 *
 * @param supplierId - Supplier to check
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with low stock items
 *
 * @example
 * ```typescript
 * const { data: lowStockItems } = useLowStockQuery('SUP-001');
 *
 * return <AlertTable data={lowStockItems} />;
 * ```
 */
export function useLowStockQuery(supplierId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'low-stock-items', supplierId],
    queryFn: () => getLowStockItems(supplierId),
    enabled: enabled && !!supplierId,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
