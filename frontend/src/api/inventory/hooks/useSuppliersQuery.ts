/**
 * @file useSuppliersQuery.ts
 * @module api/inventory/hooks
 *
 * @summary
 * Hook to load suppliers for dropdown/autocomplete selection.
 * Provides normalized supplier options with consistent caching strategy.
 *
 * @enterprise
 * - 5-minute cache reduces API calls and improves UX
 * - Conditional enabling for performance optimization
 * - Normalized to SupplierOption shape for UI consistency
 * - Graceful error handling with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersLite } from '../../analytics/suppliers';
import type { SupplierOption } from '../../analytics/types';

/**
 * Hook to load suppliers for dropdown/autocomplete selection.
 * Caches results for 5 minutes to reduce API calls.
 *
 * @param enabled - Whether to fetch suppliers (typically tied to dialog open state)
 * @returns React Query result with supplier options
 *
 * @enterprise
 * - Only fetches when enabled (performance optimization)
 * - 5-minute cache reduces backend load
 * - Maps backend data to normalized SupplierOption shape
 * - Handles loading and error states automatically
 *
 * @example
 * ```typescript
 * const { data: suppliers, isLoading } = useSuppliersQuery(dialogOpen);
 *
 * <Select disabled={isLoading}>
 *   {suppliers?.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
 * </Select>
 * ```
 */
export function useSuppliersQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['suppliers', 'lite'],
    queryFn: async () => {
      const suppliers = await getSuppliersLite();
      return suppliers.map((supplier): SupplierOption => ({
        id: supplier.id,
        label: supplier.name,
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
