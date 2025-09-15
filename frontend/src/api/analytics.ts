/**
 * @file analytics.ts
 * @description
 * API helpers for analytics charts. These functions are resilient:
 * - Return [] on errors/404 so charts render gracefully.
 * - Normalize server field variants so the FE can rely on stable shapes.
 *
 * Endpoints covered:
 * - GET /api/analytics/stock-value           → { date, totalValue }[]
 * - GET /api/analytics/monthly-stock-movement → { month, stockIn, stockOut }[]
 * - GET /api/inventory                        → used to build a small item list for the price trend
 * - GET /api/analytics/price-trend            → { date, price }[] (from { timestamp, price })
 */

import http from './httpClient';

export type StockValuePoint = { date: string; totalValue: number };
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

// Price trend API returns "timestamp" and "price" (BigDecimal serialized)
type BackendPriceTrendDTO = {
  timestamp: string;       // e.g., "2025-06-01"
  price: number | string;  // BigDecimal serialized as string
};

// --- Date helpers ------------------------------------------------------------

/** Formats a Date into 'YYYY-MM-DD'. */
const fmt = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Default 6-month window ending today.
 * Many analytics screens benefit from a bounded window by default.
 */
const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  return { start: fmt(start), end: fmt(end) };
};

// --- Internal normalizers (type-safe, no `any`) ------------------------------

/**
 * Picks the first defined property from a record by trying multiple keys.
 * Useful when BE variants exist (e.g., totalValue | total_value | value).
 */
function pickFirst<K extends string>(
  rec: Record<string, unknown>,
  keys: readonly K[],
  fallback: unknown = undefined
): unknown {
  for (const k of keys) {
    if (k in rec && rec[k] != null) return rec[k];
  }
  return fallback;
}

/** Coerces an unknown value into string. */
function asString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  return String(v);
}

/** Coerces an unknown value into number (NaN becomes 0). */
function asNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Type guard for filtering nullable points. */
function isStockValuePoint(x: StockValuePoint | null): x is StockValuePoint {
  return !!x;
}

// --- API functions -----------------------------------------------------------

/**
 * Fetches aggregated stock value over time (last 6 months by default) and
 * normalizes all backend variants into `{ date, totalValue }`.
 *
 * Accepted input variants:
 * - date keys:       'date' | 'timestamp' | 'day' | 'day_str'
 * - total value keys:'totalValue' | 'total_value' | 'value' | 'sum'
 */
export async function getStockValueOverTime(): Promise<StockValuePoint[]> {
  const { start, end } = defaultRange();
  try {
    const { data } = await http.get<unknown[]>('/api/analytics/stock-value', {
      params: { start, end },
      withCredentials: true, // ensure session cookie is included when needed
    });

    if (!Array.isArray(data)) return [];

    return data
      .map((row: unknown): StockValuePoint | null => {
        if (!row || typeof row !== 'object') return null;
        const rec = row as Record<string, unknown>;

        const dateRaw = pickFirst(rec, ['date', 'timestamp', 'day', 'day_str'], '');
        const totalRaw = pickFirst(rec, ['totalValue', 'total_value', 'value', 'sum'], 0);

        const date = asString(dateRaw);
        if (!date) return null; // drop malformed rows early

        const totalValue = asNumber(totalRaw);
        return { date, totalValue };
      })
      .filter(isStockValuePoint);
  } catch {
    return [];
  }
}

/**
 * Monthly movement: inbound vs outbound stock.
 * Normalized BE shape already matches FE needs.
 */
export async function getMonthlyStockMovement(): Promise<MonthlyMovementPoint[]> {
  const { start, end } = defaultRange();
  try {
    // BE: GET /api/analytics/monthly-stock-movement?start=...&end=...[&supplierId=...]
    const { data } = await http.get<unknown>('/api/analytics/monthly-stock-movement', {
      params: { start, end },
    });
    return Array.isArray(data) ? (data as MonthlyMovementPoint[]) : [];
  } catch {
    return [];
  }
}

/**
 * Returns a small list of selectable items for the Price Trend card.
 * Uses the inventory list (id/name) as a pragmatic source of options.
 */
export async function getTopItems(): Promise<ItemRef[]> {
  try {
    const { data } = await http.get<unknown>('/api/inventory');
    if (!Array.isArray(data)) return [];
    return (data as InventoryRow[])
      .map((it) => ({
        id: String(it.id ?? it.itemId ?? ''),
        name: String(it.name ?? it.itemName ?? ''),
      }))
      .filter((x) => x.id && x.name)
      .slice(0, 20);
  } catch {
    return [];
  }
}

/**
 * Price trend for a selected item within the default window.
 * Maps `{ timestamp, price }` into `{ date, price }`.
 */
export async function getPriceTrend(itemId: string): Promise<PricePoint[]> {
  if (!itemId) return [];
  const { start, end } = defaultRange();
  try {
    // BE: GET /api/analytics/price-trend?itemId=&start=&end=
    const { data } = await http.get<unknown>('/api/analytics/price-trend', {
      params: { itemId, start, end },
    });
    if (!Array.isArray(data)) return [];
    return (data as BackendPriceTrendDTO[]).map((d) => ({
      date: d.timestamp,
      price: asNumber(d.price),
    }));
  } catch {
    return [];
  }
}
