/**
 * @file useSupplierByIdQuery.ts
 * @module api/suppliers/hooks/useSupplierByIdQuery
 *
 * @summary
 * React Query hook that loads a single supplier by ID, used in edit dialogs and detail views.
 *
 * @enterprise
 * - Loads a single supplier via the dedicated GET /api/suppliers/:id
 *   (SupplierController.getById), not by scanning the full list.
 * - Returns null (not an error) when the supplier is not found, so callers can handle gracefully.
 */

import { useQuery } from '@tanstack/react-query';
import { getSupplierById } from '../supplierListFetcher';
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

      return await getSupplierById(supplierId);
    },
    enabled: enabled && !!supplierId,
    staleTime: 60_000,  // 1 min
    gcTime: 5 * 60_000, // 5 min; gcTime renamed from cacheTime in TanStack Query v5
  });
};
