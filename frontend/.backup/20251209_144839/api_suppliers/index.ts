/**
 * @file index.ts
 * @module api/suppliers
 *
 * @summary
 * Supplier API client for fetching and managing suppliers.
 * Provides paginated list, create, update, and delete operations.
 *
 * @enterprise
 * - Tolerant loading: returns safe fallbacks instead of throwing
 * - Centralized endpoint bases for easy configuration changes
 * - Type-safe requests and responses
 * - Comprehensive error handling
 *
 * @usage
 * ```typescript
 * const response = await getSuppliersPage({ page: 1, pageSize: 10, q: 'acme' });
 * ```
 */

import http from '../httpClient';
import type { SupplierListResponse, SupplierListParams, SupplierRow, SupplierDTO } from './types';

/** Centralized endpoint base. */
export const SUPPLIERS_BASE = '/api/suppliers';

/** Small helpers for safe narrowing. */
type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === 'object' && v !== null;

const pickString = (r: UnknownRecord, k: string): string | undefined => {
  const v = r[k];
  return typeof v === 'string' ? v : undefined;
};

const pickNumber = (r: UnknownRecord, k: string): number | undefined => {
  const v = r[k];
  return typeof v === 'number' ? v : undefined;
};

const resDataOrEmpty = (res: unknown): UnknownRecord => {
  if (!isRecord(res)) return {};
  const data = res.data;
  return isRecord(data) ? data : {};
};

const extractArray = (r: UnknownRecord, keys: string[]): unknown[] => {
  for (const k of keys) {
    const v = r[k];
    if (Array.isArray(v)) return v;
  }
  return [];
};

/**
 * Fetch paginated suppliers from backend.
 * Tolerant: returns empty page on error instead of throwing.
 *
 * @param params - Filter, pagination, sort parameters
 * @returns Paginated supplier list or empty fallback
 *
 * @example
 * ```typescript
 * const res = await getSuppliersPage({ page: 1, pageSize: 20 });
 * console.log(res.items); // SupplierRow[]
 * ```
 */
export async function getSuppliersPage(params: SupplierListParams): Promise<SupplierListResponse> {
  try {
    const res = await http.get(SUPPLIERS_BASE, {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        ...(params.q && { q: params.q }),
        ...(params.sort && { sort: params.sort }),
      },
    });

    const data = resDataOrEmpty(res);

    // Backend may return array directly or wrapped in envelope
    const items = Array.isArray(data)
      ? data
      : extractArray(data, ['content', 'items', 'results']);

    // Map backend response to SupplierRow
    const suppliers: SupplierRow[] = [];
    for (const entry of items) {
      if (!isRecord(entry)) continue;

      const row: SupplierRow = {
        id: pickString(entry, 'id') || String(pickNumber(entry, 'id') || ''),
        name: pickString(entry, 'name') || '',
        contactName: pickString(entry, 'contactName') ?? null,
        phone: pickString(entry, 'phone') ?? null,
        email: pickString(entry, 'email') ?? null,
        createdBy: pickString(entry, 'createdBy') ?? null,
        createdAt: pickString(entry, 'createdAt') ?? null,
      };

      if (row.id && row.name) {
        suppliers.push(row);
      }
    }

    // Extract pagination metadata
    const total = typeof data.total === 'number' ? data.total : suppliers.length;
    const page = typeof data.page === 'number' ? data.page : params.page;
    const pageSize = typeof data.pageSize === 'number' ? data.pageSize : params.pageSize;

    return { items: suppliers, total, page, pageSize };
  } catch (err) {
    // Tolerant: return empty page
    console.warn('[getSuppliersPage] Error:', err);
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}

/**
 * Create new supplier.
 * @param supplier - Supplier data (id and createdAt are auto-filled)
 * @returns Created supplier with system-generated id
 */
export async function createSupplier(supplier: SupplierDTO): Promise<{ success: SupplierRow | null; error?: string }> {
  try {
    const res = await http.post(SUPPLIERS_BASE, supplier);
    const data = resDataOrEmpty(res);

    const created: SupplierRow = {
      id: pickString(data, 'id') || '',
      name: pickString(data, 'name') || '',
      contactName: pickString(data, 'contactName') ?? null,
      phone: pickString(data, 'phone') ?? null,
      email: pickString(data, 'email') ?? null,
      createdBy: pickString(data, 'createdBy') ?? null,
      createdAt: pickString(data, 'createdAt') ?? null,
    };

    return { success: created.id ? created : null, error: created.id ? undefined : 'Invalid response' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create supplier';
    return { success: null, error: msg };
  }
}

/**
 * Update existing supplier.
 * @param id - Supplier ID
 * @param supplier - Updated supplier data
 * @returns Updated supplier or error
 */
export async function updateSupplier(id: string, supplier: SupplierDTO): Promise<{ success: SupplierRow | null; error?: string }> {
  try {
    const res = await http.put(`${SUPPLIERS_BASE}/${id}`, supplier);
    const data = resDataOrEmpty(res);

    const updated: SupplierRow = {
      id: pickString(data, 'id') || id,
      name: pickString(data, 'name') || '',
      contactName: pickString(data, 'contactName') ?? null,
      phone: pickString(data, 'phone') ?? null,
      email: pickString(data, 'email') ?? null,
      createdBy: pickString(data, 'createdBy') ?? null,
      createdAt: pickString(data, 'createdAt') ?? null,
    };

    return { success: updated.name ? updated : null, error: updated.name ? undefined : 'Invalid response' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update supplier';
    return { success: null, error: msg };
  }
}

/**
 * Delete supplier by ID.
 * @param id - Supplier ID
 * @returns Success or error
 */
export async function deleteSupplier(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await http.delete(`${SUPPLIERS_BASE}/${id}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete supplier';
    return { success: false, error: msg };
  }
}

export * from './types';
