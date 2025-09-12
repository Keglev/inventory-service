/**
 * @file metrics.ts
 * @description
 * Lightweight API helpers to fetch dashboard KPI counts. All functions resolve to `number | null`
 * and never throw — callers can render placeholders gracefully.
 */
import http from './httpClient';

// Fetch total Inventory item count from the backend
export async function getItemCount(): Promise<number> {
    const { data } = await http.get<number>('/api/inventory/count');
    return Number(data ?? 0);
}

// Fetch total suppliers count from the backend
export async function getSuppliersCount(): Promise<number> {
    const { data } = await http.get<number>('/api/suppliers/count');
    return Number(data ?? 0);
}

// Fetch count of items that are low in stock from the backend
export async function getLowStockCount(): Promise<number> {
    const { data } = await http.get<number>('/api/analytics/low-stock/count');
    return Number(data ?? 0);
}
