/**
 * @module api/inventory/hooks/useSuppliersQuery
 *
 * Provides a React Query hook that loads a minimal supplier list from
 * `GET /api/suppliers` for dropdown and autocomplete controls.
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersLite } from '../../analytics/suppliers';
import type { SupplierOption } from '../../analytics/types';

/**
 * Loads a lightweight supplier list for selector controls.
 *
 * The `enabled` parameter lets callers defer the fetch until the control that
 * needs suppliers is actually visible (e.g. when a dialog opens), avoiding an
 * unnecessary network request on every render.
 *
 * Backend `name` is mapped to `label` to satisfy the `{ id, label }` contract
 * expected by UI option-list components.
 *
 * @param enabled - Pass `true` when the supplier selector is mounted/open;
 *   `false` suppresses the request entirely.
 * @returns React Query result whose `data` is a `SupplierOption[]`.
 *
 * @example
 * ```typescript
 * const { data: suppliers, isLoading } = useSuppliersQuery(dialogOpen);
 * ```
 */
export function useSuppliersQuery(enabled: boolean) {
  return useQuery({
    // Single shared cache entry; all dialogs/controls in the session reuse
    // the same supplier list rather than issuing duplicate requests.
    queryKey: ['suppliers', 'lite'],
    queryFn: async () => {
      const suppliers = await getSuppliersLite();
      return suppliers.map((supplier): SupplierOption => ({
        id: supplier.id,
        label: supplier.name,
      }));
    },
    enabled,
    // Supplier lists change rarely; 5 min avoids repeated fetches as the user
    // opens and closes dialogs within a session without holding stale data
    // indefinitely.
    staleTime: 5 * 60 * 1000,
  });
}
