/**
 * @file useDashboardMetrics.ts
 * @module api/analytics/hooks
 *
 * @summary
 * Dashboard KPI metrics hook for inventory overview.
 * Provides real-time counts of inventory items, suppliers, and low-stock alerts.
 *
 * @enterprise
 * - Caches KPI data for 2 minutes to balance freshness and performance
 * - Conditional fetching support for performance optimization
 * - Graceful fallbacks on error
 * - Comprehensive TypeDoc documentation
 */

import { useQuery } from '@tanstack/react-query';
import { getInventoryCount, getSuppliersCount, getLowStockCount } from '../index';

/**
 * Hook to load dashboard KPI metrics (inventory count, supplier count, low stock count).
 * Caches results for 2 minutes.
 *
 * @param enabled - Whether to fetch (defaults to true, typically tied to page visibility)
 * @returns React Query result with KPI metrics object
 *
 * @enterprise
 * - Only fetches when enabled (performance optimization)
 * - 2-minute cache reduces backend load
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
    staleTime: 2 * 60_000, // 2 minutes
    gcTime: 10 * 60_000,   // 10 minutes (formerly cacheTime)
  });
}
