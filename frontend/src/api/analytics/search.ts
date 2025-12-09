/**
* @file search.ts
* @module api/analytics/search
*
* @summary
* Item search & lists (global and supplier-scoped) with resilient fallbacks.
*
* Design choices
* - We cache which query param the backend accepts for search (search|q|query|name)
* to avoid probing on every keystroke. Cache lives for the session.
* - We **never** silently downgrade a supplier-scoped search to global at the API level.
* If a nested endpoint is missing, callers should decide how to render that state.
* * - All functions return `[]` on any error to keep typeahead UIs functional.
* * @enterprise
* * - Session caching of working search parameter for performance
* * - Multiple search parameter support with fallback probing
* * - Supplier-scoped item fetching and searching
* * - TypeDoc documentation for item search utilities
*/

import http from '../httpClient';
import { clientFilter, normalizeItemsList } from './util';
import type { ItemRef } from './types';


// Session cache for the working search parameter name used by /api/inventory search.
let INVENTORY_SEARCH_PARAM: 'search' | 'q' | 'query' | 'name' | null = null;


/** Fetch a small list of items (generic dropdowns; may be supplier-scoped). 
 * Returns array of {id, name}. Empty array on errors.
 * @example
 * ```typescript
 * const items = await getTopItems({ supplierId: 'SUP-001', limit: 30 });
 * return <Select options={items} />;
 * ```
*/
export async function getTopItems(opts?: { supplierId?: string; limit?: number }): Promise<ItemRef[]> {
    const limit = opts?.limit ?? 20;
    try {
        const params: Record<string, string | number> = { limit };
        if (opts?.supplierId) params.supplierId = opts.supplierId;
        
        // Call inventory endpoint
        const { data } = await http.get<unknown>('/api/inventory', { params });
        return normalizeItemsList(data);
    } catch {
        return [];
    }
}
/** Global item search (no supplier filter). 
 * Returns array of {id, name}. Empty array on errors.
 * @example
 * ```typescript
 * const items = await searchItemsGlobal('widget', 50);
 * return <Select options={items} />;
 * ```
*/
export async function searchItemsGlobal(q: string, limit: number = 50): Promise<ItemRef[]> {
    const text = q.trim();
    if (!text) return [];
    
    
    // Helper to call /api/inventory with a given param name.
    const callWith = async (paramKey: 'search' | 'q' | 'query' | 'name'): Promise<ItemRef[]> => {
        try {
            const params: Record<string, string | number> = { limit };
            params[paramKey] = text;
            const { data } = await http.get<unknown>('/api/inventory', { params });
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
/** Fetch items that belong to a specific supplier (strict scope). 
 * Returns array of {id, name}. Empty array on errors.
 * @example
 * ```typescript
 * const items = await getItemsForSupplier('SUP-001', 100);
 * return <Select options={items} />;
 * ```
*/
export async function getItemsForSupplier(supplierId: string, limit: number = 500): Promise<ItemRef[]> {
    if (!supplierId) return [];
    
    
    // 1) Preferred nested endpoint
    try {
        const { data } = await http.get<unknown>(`/api/suppliers/${encodeURIComponent(supplierId)}/items`, {
            params: { limit },
        });
        const rows = normalizeItemsList(data);
        if (rows.length) return rows;
    } catch {
        /* continue */
    }
    
    
    // 2) Fallback: inventory endpoint that accepts supplierId as a filter
    try {
        const { data } = await http.get<unknown>('/api/inventory', { params: { supplierId, limit } });
        return normalizeItemsList(data);
    } catch {
        return [];
    }
}
/** Supplier-scoped item search (does not silently downgrade to global). 
 * Returns array of {id, name}. Empty array on errors.
 * @example
 * ```typescript
 * const items = await searchItemsForSupplier('SUP-001', 'widget', 50);
 * return <Select options={items} />;
 * ```
*/
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
            const { data } = await http.get<unknown>('/api/inventory', { params });
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