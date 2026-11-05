/**
 * @file useDashboardMetrics.ts
 * @module api/analytics/hooks/useDashboardMetrics
 *
 * @summary
 * Dashboard KPI metrics hook: inventory item, supplier and low-stock counts.
 *
 * @enterprise
 * - Cached for 2 minutes (staleTime), so the counts are at most that old; the
 *   header bell and the notifications menu read the same cached query.
 * - Each count fetcher answers 0 on error, so a failed request shows 0, not an error.
 */

import { useQuery } from '@tanstack/react-query';
import { getItemCount, getSupplierCount, getLowStockCount } from '../metrics';

/**
 * Hook to load dashboard KPI metrics (inventory count, supplier count, low stock count).
 * Caches results for 2 minutes.
 *
 * @param enabled - Whether to fetch (defaults to true, typically tied to page visibility)
 * @returns React Query result with KPI metrics object
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
        getItemCount(),
        getSupplierCount(),
        getLowStockCount(),
      ]);

      return {
        inventoryCount,
        suppliersCount,
        lowStockCount,
      };
    },
    enabled,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}
