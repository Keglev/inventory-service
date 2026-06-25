/**
 * @module api/analytics/suppliers
 *
 * Fetches a minimal supplier list for use in dropdowns and filter controls.
 * Hits `GET /api/suppliers` with a capped result count so the UI can populate
 * supplier selectors without loading full supplier records.
 */
import http from '../httpClient';
import type { SupplierRef } from './types';

/**
 * Returns a lightweight `{id, name}` list for populating supplier dropdowns.
 * Silently returns an empty array on network or parse errors so filter controls
 * degrade gracefully rather than blocking the UI.
 *
 * Calls `GET /api/suppliers?limit=200`.
 * @example
 * ```typescript
 * const suppliers = await getSuppliersLite();
 * return <Select options={suppliers} />;
 * ```
 */
export async function getSuppliersLite(): Promise<SupplierRef[]> {
    try {
        const { data } = await http.get<unknown>('/api/suppliers', { params: { limit: 200 } });
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