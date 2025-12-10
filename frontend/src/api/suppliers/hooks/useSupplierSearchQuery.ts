/**
 * @file useSupplierSearchQuery.ts
 * @module api/suppliers/hooks/useSupplierSearchQuery
 *
 * @summary
 * React Query hook for searching suppliers.
 * Client-side filtering for instant search feedback.
 *
 * @enterprise
 * - Client-side filtering for instant search feedback
 * - Searches name, email, phone, contactName fields
 * - Returns full supplier rows for display flexibility
 * - Case-insensitive matching
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersPage } from '../supplierListFetcher';
import type { SupplierRow } from '../types';

/**
 * Hook to search suppliers by query string.
 * Searches within loaded suppliers (client-side filtering).
 * Useful for autocomplete and search dialogs.
 *
 * @param query - Search query string (e.g., supplier name or email)
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with filtered supplier results
 *
 * @enterprise
 * - Only fetches when query length >= 2 characters
 * - Client-side filtering for instant search feedback
 * - Returns full supplier rows for display flexibility
 * - Case-insensitive matching
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
      if (!query.trim()) return [];

      // Fetch suppliers using backend search
      const response = await getSuppliersPage({
        page: 1,
        pageSize: 1000, // Fetch more suppliers for search
        q: query,
      });

      return response.items;
    },
    enabled: enabled && query.length >= 2,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
  });
};
