/**
 * @file metrics.ts
 * @description
 * Lightweight API helpers to fetch dashboard KPI counts. All functions resolve to `number | null`
 * and never throw — callers can render placeholders gracefully.
 */
import http from './httpClient';

// Fetch total inventory item count from the backend
export async function getInventoryCount(): Promise<number | null> {
  try {
    const { data } = await http.get<number>('/api/inventory/count');
    return data ?? null;
  } catch {
    return null;
  }
}

// Fetch total suppliers count from the backend
export async function getSuppliersCount(): Promise<number | null> {
  try {
    const { data } = await http.get<number>('/api/suppliers/count');
    return data ?? null;
  } catch {
    return null;
  }
}

// Fetch count of items that are low in stock from the backend
export async function getLowStockCount(): Promise<number | null> {
  try {
    const { data } = await http.get<number>('/api/analytics/low-stock/count');
    return data ?? null;
  } catch {
    return null;
  }
}
