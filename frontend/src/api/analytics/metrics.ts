/**
 * @module api/analytics/metrics
 *
 * Aggregates scalar count metrics across three domains: inventory items
 * (`/api/inventory/count`), suppliers (`/api/suppliers/count`), and
 * low-stock alerts (`/api/analytics/low-stock/count`). Each helper is
 * intentionally fault-tolerant — it returns 0 on any HTTP error so callers
 * can render partial dashboards without cascading failures.
 */

import http from '../httpClient';

/**
 * Total number of inventory items currently stored in the system.
 * Calls `GET /api/inventory/count` → `number`.
 * Returns 0 on error so a single backend failure does not break the dashboard.
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
 * Total number of suppliers registered in the system.
 * Calls `GET /api/suppliers/count` → `number`.
 * Returns 0 on error so a single backend failure does not break the dashboard.
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
 * Number of inventory items currently below their minimum stock threshold.
 * Calls `GET /api/analytics/low-stock/count` → `number`.
 * Returns 0 on error so a single backend failure does not break the dashboard.
 */
export async function getLowStockCount(): Promise<number> {
  try {
    const { data } = await http.get<number>('/api/analytics/low-stock/count');
    return Number(data ?? 0);
  } catch {
    return 0;
  }
}
