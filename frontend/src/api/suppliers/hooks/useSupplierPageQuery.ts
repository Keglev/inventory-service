/**
 * @file useSupplierPageQuery.ts
 * @module api/suppliers/hooks/useSupplierPageQuery
 *
 * @summary
 * React Query hook for paginated supplier list fetching.
 * Handles caching, loading states, and error management.
 *
 * @enterprise
 * - Consistent caching strategy: 1-minute cache for supplier lists
 * - Performance optimized with conditional enabling
 * - Error handling with graceful fallbacks
 * - Type-safe pagination model for DataGrid integration
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersPage } from '../supplierListFetcher';
import type { SupplierListParams } from '../types';

/**
 * Hook to load paginated suppliers from the backend.
 * Caches results for 1 minute to reduce API calls.
 *
 * @param params - Pagination, filtering, and sorting parameters
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with paginated supplier data
 *
 * @enterprise
 * - Only fetches when enabled (performance optimization)
 * - 1-minute cache reduces backend load for rapid pagination
 * - Automatically handles loading and error states
 * - Type-safe pagination model for DataGrid integration
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useSupplierPageQuery(
 *   { page: 1, pageSize: 10, q: 'acme' },
 *   true
 * );
 *
 * return <DataGrid rows={data?.items} rowCount={data?.total} loading={isLoading} />;
 * ```
 */
export const useSupplierPageQuery = (
  params: SupplierListParams,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ['suppliers', 'page', params.page, params.pageSize, params.q, params.sort],
    queryFn: () => getSuppliersPage(params),
    enabled,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes (formerly cacheTime)
  });
};
