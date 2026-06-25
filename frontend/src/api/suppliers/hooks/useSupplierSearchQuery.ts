/**
 * @file useSupplierSearchQuery.ts
 * @module api/suppliers/hooks/useSupplierSearchQuery
 *
 * @summary
 * React Query hook that searches suppliers by name via the dedicated backend search endpoint.
 *
 * @enterprise
 * - Searches via GET /api/suppliers/search?name= (the dedicated backend endpoint). Match is
 *   case-insensitive substring on supplier name only. Activates at query length >= 2.
 */

import { useQuery } from '@tanstack/react-query';
import { searchSuppliersByName } from '../supplierListFetcher';
import type { SupplierRow } from '../types';

/**
 * Searches suppliers matching query and returns the filtered SupplierRow array.
 *
 * @param query - Search query string (e.g., supplier name fragment)
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with matching supplier results
 *
 * @example
 * ```typescript
 * const { data: results } = useSupplierSearchQuery('acme', searchQuery.length >= 2);
 *
 * <Autocomplete
 *   options={results || []}
 *   getOptionLabel={(s) => s.name}
 * />
 * ```
 */
export const useSupplierSearchQuery = (
  query: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ['suppliers', 'search', query],
    queryFn: async (): Promise<SupplierRow[]> => {
      const trimmed = query.trim();
      if (trimmed.length < 2) return [];

      return await searchSuppliersByName(trimmed);
    },
    enabled: enabled && query.length >= 2,
    staleTime: 60_000,  // 1 min
    gcTime: 5 * 60_000, // 5 min; gcTime renamed from cacheTime in TanStack Query v5
  });
};
