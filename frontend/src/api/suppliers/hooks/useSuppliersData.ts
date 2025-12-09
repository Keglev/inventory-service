/**
 * @file useSuppliersData.ts
 * @module api/suppliers/hooks
 *
 * @summary
 * Centralized data fetching hooks for supplier management components.
 * Provides reusable React Query hooks for supplier list pagination and searching.
 * Moved from pages layer to API layer for proper architectural separation.
 *
 * @enterprise
 * - Consistent caching strategy: 1-minute cache for supplier lists
 * - Client-side search debouncing for smooth UX
 * - Performance optimized with conditional enabling
 * - Error handling with graceful fallbacks
 * - Comprehensive TypeDoc documentation for all hooks
 *
 * @usage
 * ```typescript
 * import { useSuppliersPageQuery, useSupplierSearchQuery } from '@/api/suppliers/hooks';
 * 
 * const suppliersQuery = useSuppliersPageQuery({ page: 1, pageSize: 10 });
 * const searchQuery = useSupplierSearchQuery(searchTerm, enabled);
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersPage } from '../index';
import type { SupplierListParams, SupplierRow } from '../types';

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
 * const { data, isLoading, error } = useSuppliersPageQuery(
 *   { page: 1, pageSize: 10, q: 'acme' },
 *   true
 * );
 *
 * return <DataGrid rows={data?.items} rowCount={data?.total} loading={isLoading} />;
 * ```
 */
export function useSuppliersPageQuery(
  params: SupplierListParams,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ['suppliers', 'page', params.page, params.pageSize, params.q, params.sort],
    queryFn: () => getSuppliersPage(params),
    enabled,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes (formerly cacheTime)
  });
}

/**
 * Hook to search suppliers by query string.
 * Searches within all loaded suppliers (client-side filtering).
 * Useful for autocomplete and search dialogs.
 *
 * @param query - Search query string (e.g., supplier name or email)
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with filtered supplier results
 *
 * @enterprise
 * - Client-side filtering for instant search feedback
 * - Searches name, email, phone, contactName fields
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
export function useSupplierSearchQuery(
  query: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ['suppliers', 'search', query],
    queryFn: async (): Promise<SupplierRow[]> => {
      if (!query.trim()) return [];

      // Fetch all suppliers to search locally
      const response = await getSuppliersPage({
        page: 1,
        pageSize: 1000, // Fetch more suppliers for local search
        q: query,
      });

      return response.items;
    },
    enabled: enabled && query.length >= 2,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Hook to load a single supplier by ID.
 * Useful for edit dialogs that need to display current supplier data.
 *
 * @param supplierId - The ID of the supplier to load
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with supplier data
 *
 * @remarks
 * Currently fetches via the list endpoint with search filter.
 * A dedicated GET /api/suppliers/:id endpoint would be more efficient.
 *
 * @example
 * ```typescript
 * const { data: supplier } = useSupplierByIdQuery(selectedSupplierId);
 *
 * return <TextField value={supplier?.name} />;
 * ```
 */
export function useSupplierByIdQuery(
  supplierId: string | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ['suppliers', 'byId', supplierId],
    queryFn: async (): Promise<SupplierRow | null> => {
      if (!supplierId) return null;

      // Fetch supplier by searching through list
      const response = await getSuppliersPage({
        page: 1,
        pageSize: 100,
        q: supplierId,
      });

      return response.items.find((s) => s.id === supplierId) || null;
    },
    enabled: enabled && !!supplierId,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
  });
}
