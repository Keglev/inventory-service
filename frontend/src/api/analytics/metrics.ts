/**
 * @file metrics.ts
 * @module api/analytics/metrics
 *
 * @summary
 * Dashboard KPI metrics - lightweight API helpers for inventory counts.
 * All functions are tolerant and never throw; they return graceful defaults.
 *
 * @enterprise
 * - Resilient: Returns 0 on error instead of throwing
 * - Fast: Direct HTTP calls for simple count operations
 * - Type-safe: Promise<number> return type
 * - No side effects: Pure functions suitable for React Query hooks
 */

import http from '../httpClient';

/**
 * Fetch total inventory item count from backend.
 * Returns 0 on any error (tolerant).
 *
 * @returns Total number of inventory items
 * @example
 * ```typescript
 * const count = await getItemCount();
 * console.log(count); // 150
 * ```
 */
export async function getItemCount(): Promise<number> {
  try {
    const { data } = await http.get<number>('/api/inventory/count');
    return Number(data ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Fetch total suppliers count from backend.
 * Returns 0 on any error (tolerant).
 *
 * @returns Total number of suppliers
 * @example
 * ```typescript
 * const count = await getSupplierCount();
 * console.log(count); // 25
 * ```
 */
export async function getSupplierCount(): Promise<number> {
  try {
    const { data } = await http.get<number>('/api/suppliers/count');
    return Number(data ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Fetch count of items below minimum stock threshold.
 * Returns 0 on any error (tolerant).
 *
 * @returns Total count of low-stock items
 * @example
 * ```typescript
 * const count = await getLowStockCount();
 * console.log(count); // 12
 * ```
 */
export async function getLowStockCount(): Promise<number> {
  try {
    const { data } = await http.get<number>('/api/analytics/low-stock/count');
    return Number(data ?? 0);
  } catch {
    return 0;
  }
}

/* -------------------------------------------------------------------------- */
/* Aliases for backward compatibility                                         */
/* -------------------------------------------------------------------------- */

/**
 * Alias for getItemCount() - kept for backward compatibility with Dashboard.tsx
 * @deprecated Use getItemCount() instead
 */
export const getInventoryCount = getItemCount;

/**
 * Alias for getSupplierCount() - kept for backward compatibility with Dashboard.tsx
 * @deprecated Use getSupplierCount() instead
 */
export const getSuppliersCount = getSupplierCount;
