/**
 * @file useSupplierListQuery.ts
 * @module api/suppliers/hooks/useSupplierListQuery
 *
 * @summary
 * React Query hook and shared query definition for the full supplier list:
 * the suppliers board, the inventory dialogs and the analytics filter.
 *
 * @enterprise
 * - GET /api/suppliers returns every supplier and takes no parameters, so one
 *   cache entry serves every page and sort order; the grid pages and sorts in
 *   the browser.
 * - staleTime 1 min / gcTime 5 min: balances freshness against backend load.
 * - enabled param lets callers suppress the fetch without unmounting.
 * - One cache entry for every reader of GET /api/suppliers: a supplier write
 *   invalidates ['suppliers'] and so refreshes all of them. Readers that need
 *   another shape derive it with `select` (useSuppliersQuery).
 */

import { useQuery } from '@tanstack/react-query';
import { getAllSuppliers } from '../supplierListFetcher';

/**
 * The supplier list query: key, loader and cache window, shared by every
 * hook that reads the list.
 */
export const supplierListQuery = {
  queryKey: ['suppliers', 'list'] as const,
  queryFn: getAllSuppliers,
  staleTime: 60_000,  // 1 min — see @enterprise above
  gcTime: 5 * 60_000, // 5 min; gcTime renamed from cacheTime in TanStack Query v5
};

/**
 * Fetches and caches the full supplier list.
 *
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with every supplier as SupplierRow[]
 */
export const useSupplierListQuery = (enabled: boolean = true) => {
  return useQuery({ ...supplierListQuery, enabled });
};
