/**
 * @module api/shared/itemSearch
 *
 * @summary
 * Item-search primitives shared by the inventory and analytics layers.
 * Two supplier-aware fetch strategies (global and supplier-scoped) against
 * GET /api/inventory, plus the normalization and client-filter helpers they
 * depend on.
 *
 * @enterprise
 * - Co-located here (rather than under analytics, where they originated)
 *   because both the inventory type-ahead hook (useItemSearchQuery) and the
 *   analytics PriceTrendCard consume them. A single physical home removes
 *   the cross-layer import that previously had an inventory hook reaching
 *   into the analytics module.
 * - The backend's search parameter name is not stable (search | q | query |
 *   name). The first name that yields results is cached in
 *   INVENTORY_SEARCH_PARAM for the session so subsequent keystrokes do not
 *   re-probe. This is module-level mutable state; tracked under ST-APP18 for
 *   a future review of whether a session cache belongs in a shared module.
 * - Supplier-scoped search never silently downgrades to a global search: an
 *   empty result for a supplier is returned as empty, not refilled with
 *   cross-supplier rows.
 * - Every function returns [] on any error to keep type-ahead UIs functional
 *   rather than throwing into a render path.
 */

import http from '../httpClient';
import { INVENTORY_BASE } from './constants';
import type { ItemRef } from './types';

// Session cache for the working search parameter name used by /api/inventory search.
let INVENTORY_SEARCH_PARAM: 'search' | 'q' | 'query' | 'name' | null = null;

/** Absorbs field-name variations (`id`/`itemId`, `name`/`itemName`) across backend endpoints so callers always receive a uniform ItemRef[]. */
export function normalizeItemsList(data: unknown): ItemRef[] {
    if (!Array.isArray(data)) return [];
    return (data as Array<{ id?: string | number; itemId?: string | number; name?: string; itemName?: string; supplierId?: string | number | null }>)
    .map((d) => ({
        id: String(d.id ?? d.itemId ?? ''),
        name: String(d.name ?? d.itemName ?? ''),
        supplierId: typeof d.supplierId === 'string' || typeof d.supplierId === 'number' ? String(d.supplierId) : undefined,
    }))
    .filter((it) => it.id && it.name);
}

/** Safety net for when the backend ignores the search query param; filters and caps results client-side. Returns the first `limit` items when `q` is blank. */
export function clientFilter(items: ItemRef[], q: string, limit: number): ItemRef[] {
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, limit);
    return items.filter((it) => it.name.toLowerCase().includes(needle)).slice(0, limit);
}

/** Global item search against /api/inventory (no supplier filter). */
export async function searchItemsGlobal(q: string, limit: number = 50): Promise<ItemRef[]> {
    const text = q.trim();
    if (!text) return [];

    // Helper to call /api/inventory with a given param name.
    const callWith = async (paramKey: 'search' | 'q' | 'query' | 'name'): Promise<ItemRef[]> => {
        try {
            const params: Record<string, string | number> = { limit };
            params[paramKey] = text;
            const { data } = await http.get<unknown>(INVENTORY_BASE, { params });
            const rows = normalizeItemsList(data);
            if (rows.length > 0) {
                const narrowed = clientFilter(rows, text, limit);
                if (narrowed.length > 0) {
                    INVENTORY_SEARCH_PARAM = paramKey; // remember what worked
                }
                return narrowed;
            }
            return [];
        } catch {
            return [];
        }
    };

    // If we've learned a working key, try it first.
    if (INVENTORY_SEARCH_PARAM) {
        const rows = await callWith(INVENTORY_SEARCH_PARAM);
        if (rows.length > 0) return rows;
    }

    // Probe likely parameter names in order.
    for (const key of ['search', 'q', 'query', 'name'] as const) {
        const rows = await callWith(key);
        if (rows.length > 0) return rows;
    }

    return [];
}

/** Supplier-scoped item search against /api/inventory (does not silently downgrade to global). */
export async function searchItemsForSupplier(
    supplierId: string,
    q: string,
    limit: number = 50
): Promise<ItemRef[]> {
    const text = q.trim();
    if (!supplierId || !text) return [];

    // Helper to call /api/inventory with a given param name.
    const callWith = async (paramKey: 'search' | 'q' | 'query' | 'name'): Promise<ItemRef[]> => {
        try {
            const params: Record<string, string | number> = { supplierId, limit };
            params[paramKey] = text;
            const { data } = await http.get<unknown>(INVENTORY_BASE, { params });
            const rows = normalizeItemsList(data);
            if (rows.length > 0) {
                const narrowed = clientFilter(rows, text, limit);
                if (narrowed.length > 0) {
                    INVENTORY_SEARCH_PARAM = paramKey;
                }
                return narrowed;
            }
            return [];
        } catch {
            return [];
        }
    };

    // Try cached param first
    if (INVENTORY_SEARCH_PARAM) {
        const rows = await callWith(INVENTORY_SEARCH_PARAM);
        if (rows.length > 0) return rows;
    }
    // Probe likely parameter names in order.
    for (const key of ['search', 'q', 'query', 'name'] as const) {
        const rows = await callWith(key);
        if (rows.length > 0) return rows;
    }
    return [];
}
