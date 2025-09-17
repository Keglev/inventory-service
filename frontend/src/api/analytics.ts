/**
 * @file analytics.ts
 * @description
 * API helpers for analytics charts. These functions are resilient:
 * - Return [] on errors/404 so charts render gracefully.
 * - Normalize server field variants so the FE can rely on stable shapes.
 *
 * Endpoints covered:
 * - GET /api/analytics/stock-value              → { date, totalValue }[]
 * - GET /api/analytics/monthly-stock-movement  → { month, stockIn, stockOut }[]
 * - GET /api/inventory                         → item list for price trend dropdown
 * - GET /api/analytics/price-trend             → { date, price }[]
 * - GET /api/suppliers                         → minimal supplier list
 * - GET /api/analytics/low-stock-items         → { itemName, quantity, minimumQuantity }[]
 * - GET /api/analytics/stock-per-supplier      → { supplierName, totalQuantity, totalValue }[]
 */

import http from './httpClient';

// ---------------------------------------------------------------------------
// Types (public)
// ---------------------------------------------------------------------------

/** Filter params accepted by most analytics endpoints. All optional. */
export type AnalyticsParams = {
  from?: string;        // ISO yyyy-MM-dd
  to?: string;          // ISO yyyy-MM-dd
  supplierId?: string;  // string (kept string to match URLSearchParams)
};

// Public DTOs used by charts
export type StockValuePoint = { date: string; totalValue: number };
export type MonthlyMovement = { month: string; stockIn: number; stockOut: number };
export type PricePoint = { date: string; price: number };
export type ItemRef = { id: string; name: string };
export type SupplierRef = { id: string; name: string };
export type LowStockRow = { itemName: string; quantity: number; minimumQuantity: number };
export type StockPerSupplierPoint = { supplierName: string; totalQuantity: number; totalValue: number };

// ---------------------------------------------------------------------------
// Internal helpers / backend DTO shapes
// ---------------------------------------------------------------------------

type BackendStockValueDTO = { date?: string; totalValue?: unknown };
type BackendMonthlyMovementDTO = { month?: string; stockIn?: unknown; stockOut?: unknown };
type BackendPriceTrendDTO = { timestamp?: string; price?: unknown };
type BackendItemDTO = { id?: string; itemId?: string; name?: string; itemName?: string };
type BackendSupplierDTO = { id?: string | number; name?: string };
type BackendLowStockDTO = { itemName?: string; quantity?: unknown; minimumQuantity?: unknown };
type BackendSpsDTO = {
  supplierId?: string | number;
  supplierName?: string;
  totalQuantity?: unknown;
  totalValue?: unknown;
};

// Date helpers (local time → YYYY-MM-DD)
function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function asNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normalizes FE filter parameters to the BE’s expected query params.
 * BE expects `start`/`end` (LocalDate) and `supplierId` (String/Long).
 * If caller omits dates, we default to the last 180 days.
 */
function paramClean(p?: AnalyticsParams): Record<string, string> {
  const out: Record<string, string> = {};
  const from = p?.from ?? daysAgoIso(180);
  const to   = p?.to   ?? todayIso();
  out.start = from;
  out.end = to;
  if (p?.supplierId) out.supplierId = p.supplierId;
  return out;
}

// ---------------------------------------------------------------------------
// API functions (resilient)
// ---------------------------------------------------------------------------

export async function getStockValueOverTime(
  p?: AnalyticsParams
): Promise<StockValuePoint[]> {
  try {
    const { data } = await http.get<unknown>('/api/analytics/stock-value', {
      params: paramClean(p),
    });
    if (!Array.isArray(data)) return [];
    const rows = (data as BackendStockValueDTO[]).map((d) => ({
      date: String(d.date ?? ''),
      totalValue: asNumber(d.totalValue),
    }));
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  } catch {
    return [];
  }
}

export async function getMonthlyStockMovement(
  p?: AnalyticsParams
): Promise<MonthlyMovement[]> {
  try {
    const { data } = await http.get<unknown>('/api/analytics/monthly-stock-movement', {
      params: paramClean(p),
    });
    if (!Array.isArray(data)) return [];
    return (data as BackendMonthlyMovementDTO[]).map((d) => ({
      month: String(d.month ?? ''),
      stockIn: asNumber(d.stockIn),
      stockOut: asNumber(d.stockOut),
    }));
  } catch {
    return [];
  }
}

export async function getTopItems(): Promise<ItemRef[]> {
  try {
    const { data } = await http.get<unknown>('/api/inventory', { params: { limit: 20 } });
    if (!Array.isArray(data)) return [];
    return (data as BackendItemDTO[]).map((d) => ({
      id: String(d.id ?? d.itemId ?? ''),
      name: String(d.name ?? d.itemName ?? ''),
    })).filter((it) => it.id && it.name);
  } catch {
    return [];
  }
}

export async function getPriceTrend(
  itemId: string,
  p?: AnalyticsParams
): Promise<PricePoint[]> {
  if (!itemId) return [];
  try {
    const { data } = await http.get<unknown>('/api/analytics/price-trend', {
      params: { itemId, ...paramClean(p) },
    });
    if (!Array.isArray(data)) return [];
    const rows = (data as BackendPriceTrendDTO[]).map((d) => ({
      date: String(d.timestamp ?? ''),
      price: asNumber(d.price),
    }));
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  } catch {
    return [];
  }
}

export async function getSuppliersLite(): Promise<SupplierRef[]> {
  try {
    const { data } = await http.get<unknown>('/api/suppliers', { params: { limit: 200 } });
    if (!Array.isArray(data)) return [];
    return (data as BackendSupplierDTO[]).map((s) => ({
      id: String(s.id ?? ''),
      name: String(s.name ?? ''),
    })).filter((s) => s.id && s.name);
  } catch {
    return [];
  }
}

/**
 * Low-stock list for a required supplierId.
 * Returns [] if supplierId is empty or if the backend rejects.
 */
export async function getLowStockItems(supplierId: string): Promise<LowStockRow[]> {
  if (!supplierId) return [];
  try {
    const { data } = await http.get<unknown>('/api/analytics/low-stock-items', {
      params: { supplierId },
    });
    if (!Array.isArray(data)) return [];
    return (data as BackendLowStockDTO[]).map((d) => ({
      itemName: String(d.itemName ?? ''),
      quantity: asNumber(d.quantity),
      minimumQuantity: asNumber(d.minimumQuantity),
    })).filter((r) => r.itemName);
  } catch {
    return [];
  }
}

/**
 * Current snapshot of totals per supplier (no date filters in the API).
 */
export async function getStockPerSupplier(): Promise<StockPerSupplierPoint[]> {
  try {
    const { data } = await http.get<unknown>('/api/analytics/stock-per-supplier');
    if (!Array.isArray(data)) return [];
    return (data as BackendSpsDTO[]).map((d) => ({
      supplierName: String(d.supplierName ?? ''),
      totalQuantity: asNumber(d.totalQuantity),
      totalValue: asNumber(d.totalValue),
    })).filter((r) => r.supplierName);
  } catch {
    return [];
  }
}
