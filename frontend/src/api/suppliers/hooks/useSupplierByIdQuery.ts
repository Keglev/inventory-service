/**
 * @file useSupplierByIdQuery.ts
 * @module api/suppliers/hooks/useSupplierByIdQuery
 *
 * @summary
 * React Query hook for loading a single supplier by ID.
 * Useful for edit dialogs and detail views.
 *
 * @enterprise
 * - Only fetches when supplierId is provided
 * - 1-minute cache reduces redundant API calls
 * - Graceful null handling for missing data
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersPage } from '../supplierListFetcher';
import type { SupplierRow } from '../types';

/**
 * Hook to load a single supplier by ID.
 * Useful for edit dialogs that need to display current supplier data.
 *
 * @param supplierId - The ID of the supplier to load
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with supplier data or null
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
export const useSupplierByIdQuery = (
  supplierId: string | null,
  enabled: boolean = true,
) => {
  return useQuery<SupplierRow | null, Error>({
    queryKey: ['suppliers', 'byId', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;

      const response = await getSuppliersPage({
        page: 1,
        pageSize: 100,
        q: supplierId,
      });

      return response.items.find((s) => s.id === supplierId) ?? null;
    },
    enabled: enabled && !!supplierId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
};
