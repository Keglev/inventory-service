/**
 * @module api/shared/itemSearch
 *
 * @summary
 * Item-search primitives shared by the inventory and analytics layers.
 * Two supplier-aware fetch strategies (global and supplier-scoped) against
 * GET /api/inventory/search, plus the normalization helper they depend on.
 *
 * @enterprise
 * - Co-located here (rather than under analytics, where they originated)
 *   because both the inventory type-ahead hook (useItemSearchQuery) and the
 *   analytics pickers consume them. A single physical home removes the
 *   cross-layer import that previously had an inventory hook reaching
 *   into the analytics module.
 * - Backed by the paginated backend search: name, supplierId,
 *   and size are real server parameters, so no parameter probing is needed.
 * - listItemsForSupplier loads one supplier's whole item list in a single
 *   page, for the inventory dialogs that filter it in the browser
 *   (ADR-0014); it reports whether the page held every item.
 * - Supplier scoping is enforced by the backend query; an empty result for
 *   a supplier is returned as empty, never refilled with cross-supplier rows.
 * - Every function returns [] on any error to keep type-ahead UIs functional
 *   rather than throwing into a render path.
 */

import http from '../httpClient';
import { INVENTORY_BASE } from './constants';
import type { ItemRef } from './types';

/** Absorbs field-name variations (`id`/`itemId`, `name`/`itemName`) across backend endpoints so callers always receive a uniform ItemRef[]. */
export function normalizeItemsList(data: unknown): ItemRef[] {
    if (!Array.isArray(data)) return [];
    return (data as Array<{ id?: string | number; itemId?: string | number; name?: string; itemName?: string; sku?: string | null; supplierId?: string | number | null }>)
    .map((d) => ({
        id: String(d.id ?? d.itemId ?? ''),
        name: String(d.name ?? d.itemName ?? ''),
        sku: typeof d.sku === 'string' && d.sku ? d.sku : undefined,
        supplierId: typeof d.supplierId === 'string' || typeof d.supplierId === 'number' ? String(d.supplierId) : undefined,
    }))
    .filter((it) => it.id && it.name);
}

/** Extract the content array from a Spring Page envelope; non-conforming responses yield []. */
function extractPageContent(data: unknown): unknown[] {
    if (typeof data !== 'object' || data === null) return [];
    const content = (data as Record<string, unknown>).content;
    return Array.isArray(content) ? content : [];
}

/** Total row count of a Spring Page envelope ({ page: { totalElements } } or a flat totalElements); undefined when absent. */
function extractPageTotal(data: unknown): number | undefined {
    if (typeof data !== 'object' || data === null) return undefined;
    const envelope = data as { totalElements?: unknown; page?: { totalElements?: unknown } };
    const total = envelope.page?.totalElements ?? envelope.totalElements;
    return typeof total === 'number' ? total : undefined;
}

/**
 * Shared fetch against GET /api/inventory/search. supplierId is optional;
 * when present the backend scopes results to that supplier.
 */
async function searchItems(q: string, supplierId: string | undefined, limit: number): Promise<ItemRef[]> {
    const text = q.trim();
    if (!text) return [];
    try {
        const params: Record<string, string | number> = { name: text, size: limit };
        if (supplierId) params.supplierId = supplierId;
        const { data } = await http.get<unknown>(`${INVENTORY_BASE}/search`, { params });
        return normalizeItemsList(extractPageContent(data));
    } catch {
        return [];
    }
}

/** Global item search against /api/inventory/search (no supplier filter). */
export async function searchItemsGlobal(q: string, limit: number = 50): Promise<ItemRef[]> {
    return searchItems(q, undefined, limit);
}

/** Supplier-scoped item search against /api/inventory/search (scoping enforced server-side). */
export async function searchItemsForSupplier(
    supplierId: string,
    q: string,
    limit: number = 50
): Promise<ItemRef[]> {
    if (!supplierId) return [];
    return searchItems(q, supplierId, limit);
}

/** Largest page the backend serves; also the size of a supplier list searched in the browser (ADR-0014). */
const SUPPLIER_ITEM_LIST_LIMIT = 2000;

/** One supplier's item list, and whether the page held all of the supplier's items. */
export interface SupplierItemList {
    items: ItemRef[];
    complete: boolean;
}

/**
 * Loads every item of one supplier in a single page (no name filter).
 * complete is false when the page reports more items than it returned, and
 * on any error, so callers fall back to the server search.
 */
export async function listItemsForSupplier(supplierId: string): Promise<SupplierItemList> {
    try {
        const { data } = await http.get<unknown>(`${INVENTORY_BASE}/search`, {
            params: { supplierId, size: SUPPLIER_ITEM_LIST_LIMIT },
        });
        const content = extractPageContent(data);
        const total = extractPageTotal(data);
        const complete = total === undefined ? content.length < SUPPLIER_ITEM_LIST_LIMIT : total <= content.length;
        return { items: normalizeItemsList(content), complete };
    } catch {
        return { items: [], complete: false };
    }
}
