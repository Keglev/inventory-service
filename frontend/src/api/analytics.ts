/**
 * @file analytics.ts
 * @description
 * API helpers for analytics charts. These functions are resilient:
 * they return [] on errors/404 so charts render gracefully.
 */
import http from './httpClient';

export type StockValuePoint = { date: string; value: number };
export type MonthlyMovementPoint = { month: string; inbound: number; outbound: number };
export type PricePoint = { date: string; price: number };
export type ItemRef = { id: string; name: string };

export async function getStockValueOverTime(): Promise<StockValuePoint[]> {
  try {
    // Expected backend DTO: [{ date: '2025-04-01', value: 1234.56 }, ...]
    const { data } = await http.get<StockValuePoint[]>('/api/analytics/stock-value-over-time');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getMonthlyStockMovement(): Promise<MonthlyMovementPoint[]> {
  try {
    // Expected DTO: [{ month:'2025-04', inbound:120, outbound:95 }, ...]
    const { data } = await http.get<MonthlyMovementPoint[]>('/api/analytics/monthly-stock-movement');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getTopItems(): Promise<ItemRef[]> {
  try {
    // Fallback: reuse low-stock list if you already have it; adapt as needed.
    // Expected: [{ id:'...', name:'...' }, ...]
    const { data } = await http.get<ItemRef[]>('/api/analytics/top-items');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getPriceTrend(itemId: string): Promise<PricePoint[]> {
  try {
    // Expected DTO: [{ date:'2025-04-01', price:1.23 }, ...]
    const { data } = await http.get<PricePoint[]>(`/api/analytics/price-trend?itemId=${encodeURIComponent(itemId)}`);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
