/**
 * @module api/analytics/suppliers
 *
 * Fetches a minimal supplier list for use in dropdowns and filter controls.
 * Hits `GET /api/suppliers`, which returns every supplier, and keeps only the
 * id and name the selectors need.
 */
import http from '../httpClient';
import { SUPPLIERS_BASE } from '../suppliers/supplierListFetcher';
import type { SupplierRef } from './types';

/**
 * Returns a lightweight `{id, name}` list for populating supplier dropdowns.
 * Silently returns an empty array on network or parse errors so filter controls
 * degrade gracefully rather than blocking the UI.
 *
 * Calls `GET /api/suppliers`.
 * @example
 * ```typescript
 * const suppliers = await getSuppliersLite();
 * return <Select options={suppliers} />;
 * ```
 */
export async function getSuppliersLite(): Promise<SupplierRef[]> {
    try {
        const { data } = await http.get<unknown>(SUPPLIERS_BASE);
        if (!Array.isArray(data)) return [];
        return (data as Array<{ id?: string | number; name?: string }>)
        .map((s) => ({ id: String(s.id ?? ''), name: String(s.name ?? '') }))
        .filter((s) => s.id && s.name);
    } catch {
        return [];
    }
}

/** Re-exported so callers can import the type and function from a single module. */
export type { SupplierRef } from './types';