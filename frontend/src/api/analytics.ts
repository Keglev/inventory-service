/**
 * @file analytics.ts
 * @description
 * API helpers for analytics charts. These functions are resilient:
 * they return [] on errors/404 so charts render gracefully.
 * Fetches aggregated stock value over time (last 6 months by default).
 * Normalizes backend date/value field variants into `{ date, totalValue }`.
 * @returns Array of points suitable for a LineChart.
 */
import http from './httpClient';

export type StockValuePoint = { date: string; value: number };
export type MonthlyMovementPoint = { month: string; stockIn: number; stockOut: number };
export type PricePoint = { date: string; price: number };
export type ItemRef = { id: string; name: string };

// --- Backend DTO shapes (minimal, just what we consume) ---
type InventoryRow = {
  id?: number | string;
  itemId?: number | string;
  name?: string;
  itemName?: string;
};
/** Backend variants seen for stock-value aggregation. */
type BackendStockValueDTO = {
  date?: string;
  timestamp?: string;
  totalValue?: number;
  total_value?: number;
  value?: number;
};

// Price trend API returns "timestamp" and "price" (BigDecimal serialized)
type BackendPriceTrendDTO = {
  timestamp: string;       // e.g., "2025-06-01"
  price: number | string;  // BigDecimal serialized
};

// --- Helpers ---
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  return { start: fmt(start), end: fmt(end) };
};

// --- API functions ---
/**
 * Fetches aggregated stock value over time (last 6 months by default).
 * Normalizes backend field variants into `{ date, totalValue }`.
 */
export async function getStockValueOverTime(): Promise<StockValuePoint[]> {
  const { start, end } = defaultRange();
  try {
    const { data } = await http.get<BackendStockValueDTO[]>(
      '/api/analytics/stock-value',
      { params: { start, end } }
    );
    if (!Array.isArray(data)) return [];
    return data
      .map((row) => ({
        date: String(row.date ?? row.timestamp ?? ''),
        value: Number(row.totalValue ?? row.total_value ?? row.value ?? 0),
      }))
      .filter((d) => d.date);
  } catch {
    return [];
  }
}

// Monthly movement: inbound vs outbound stock
export async function getMonthlyStockMovement(): Promise<MonthlyMovementPoint[]> {
  const { start, end } = defaultRange();
  try {
    // BE: GET /api/analytics/monthly-stock-movement?start=...&end=...[&supplierId=...]
    const { data } = await http.get<MonthlyMovementPoint[]>('/api/analytics/monthly-stock-movement', {
      params: { start, end },
    });
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

// Get list of top items (by stock quantity) for selection in price trend chart
export async function getTopItems(): Promise<ItemRef[]> {
   try {
    // Use inventory list as simple source of selectable items
    const { data } = await http.get<InventoryRow[]>('/api/inventory');
    if (!Array.isArray(data)) return [];
    return data
      .map((it) => ({ id: String(it.id ?? it.itemId), name: String(it.name ?? it.itemName) }))
      .filter((x) => x.id && x.name)
      .slice(0, 20);
  } catch { return []; }
}

// Price trend for a selected item
export async function getPriceTrend(itemId: string): Promise<PricePoint[]> {
  if (!itemId) return [];
  const { start, end } = defaultRange();
  try {
    // BE: GET /api/analytics/price-trend?itemId=&start=&end=
    const { data } = await http.get<BackendPriceTrendDTO[]>('/api/analytics/price-trend', {
      params: { itemId, start, end },
    });
    if (!Array.isArray(data)) return [];
    // Map { timestamp, price } -> { date, price }
    return data.map((d) => ({
      date: d.timestamp, 
      price: Number(d.price),
    }));
  } catch { return []; }
}
