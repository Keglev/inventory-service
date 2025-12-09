/**
* @file suppliers.ts
* @module api/analytics/suppliers
*
* @summary
* Lightweight supplier lookups.
*/
import http from '../httpClient';
import type { SupplierRef } from './types';

/** Fetch a lightweight supplier list. */
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

export type { SupplierRef } from './types';