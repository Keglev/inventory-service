/**
 * @file useSupplierByIdQuery.ts
 * @module api/suppliers/hooks/useSupplierByIdQuery
 *
 * @summary
 * React Query hook that loads a single supplier by ID, used in edit dialogs and detail views.
 *
 * @enterprise
 * - A dedicated GET /api/suppliers/:id exists (SupplierController.getById) but this hook does not
 *   use it — it loads the list via getSuppliersPage and finds the row client-side, which works but
 *   is inefficient.
 * - Returns null (not an error) when the supplier is not found, so callers can handle gracefully.
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersPage } from '../supplierListFetcher';
import type { SupplierRow } from '../types';

/**
 * Loads a single supplier by ID, or null if not found.
 *
 * @param supplierId - The ID of the supplier to load
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with supplier data or null
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

      // BUCKET: switch to the existing GET /api/suppliers/:id instead of scanning the full list (B#5)
      const response = await getSuppliersPage({
        page: 1,
        pageSize: 100,
        q: supplierId,
      });

      return response.items.find((s) => s.id === supplierId) ?? null;
    },
    enabled: enabled && !!supplierId,
    staleTime: 60_000,  // 1 min
    gcTime: 5 * 60_000, // 5 min; gcTime renamed from cacheTime in TanStack Query v5
  });
};
