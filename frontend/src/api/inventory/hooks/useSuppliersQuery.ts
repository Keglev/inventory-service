/**
 * @module api/inventory/hooks/useSuppliersQuery
 *
 * Provides a React Query hook that serves the supplier list from
 * `GET /api/suppliers` as `{ id, label }` options for dropdown and
 * autocomplete controls.
 */

import { useQuery } from '@tanstack/react-query';
import { supplierListQuery } from '../../suppliers/hooks/useSupplierListQuery';
import type { SupplierRow } from '../../suppliers/types';
import type { SupplierOption } from '../../analytics/types';

const toSupplierOptions = (rows: SupplierRow[]): SupplierOption[] =>
  rows.map((supplier) => ({ id: supplier.id, label: supplier.name }));

/**
 * Supplier options for selector controls, read from the shared supplier list
 * cache (the board's entry), so a supplier write refreshes them too.
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
  return useQuery({ ...supplierListQuery, enabled, select: toSupplierOptions });
}
