/**
 * @file useSupplierPageQuery.ts
 * @module api/suppliers/hooks/useSupplierPageQuery
 *
 * @summary
 * React Query hook that wraps getSuppliersPage for use in supplier list views.
 *
 * @enterprise
 * - staleTime 1 min / gcTime 5 min: balances freshness against backend load during rapid pagination.
 * - enabled param lets callers suppress the fetch (e.g. while a dialog is closed) without unmounting.
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersPage } from '../supplierListFetcher';
import type { SupplierListParams } from '../types';

/**
 * Fetches and caches the supplier list for the given params.
 *
 * @param params - Pagination, filtering, and sorting parameters
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with paginated supplier data
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
    staleTime: 60_000,  // 1 min — see @enterprise above
    gcTime: 5 * 60_000, // 5 min; gcTime renamed from cacheTime in TanStack Query v5
  });
};
