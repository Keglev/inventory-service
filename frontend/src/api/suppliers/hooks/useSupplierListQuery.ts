/**
 * @file useSupplierListQuery.ts
 * @module api/suppliers/hooks/useSupplierListQuery
 *
 * @summary
 * React Query hook that loads the full supplier list for the suppliers board.
 *
 * @enterprise
 * - GET /api/suppliers returns every supplier and takes no parameters, so one
 *   cache entry serves every page and sort order; the grid pages and sorts in
 *   the browser.
 * - staleTime 1 min / gcTime 5 min: balances freshness against backend load.
 * - enabled param lets callers suppress the fetch without unmounting.
 */

import { useQuery } from '@tanstack/react-query';
import { getAllSuppliers } from '../supplierListFetcher';

/**
 * Fetches and caches the full supplier list.
 *
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with every supplier as SupplierRow[]
 */
export const useSupplierListQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['suppliers', 'list'],
    queryFn: getAllSuppliers,
    enabled,
    staleTime: 60_000,  // 1 min — see @enterprise above
    gcTime: 5 * 60_000, // 5 min; gcTime renamed from cacheTime in TanStack Query v5
  });
};
