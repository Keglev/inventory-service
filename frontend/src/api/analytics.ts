/**
 * @file analytics.ts
 * @module api/analytics
 *
 * @summary
 * Strongly-typed API helpers for Analytics charts/cards.
 * These functions are defensive and **never throw** to keep the UI resilient:
 * - Normalize server field variants to stable FE DTOs.
 * - Return `[]` on errors (including 4xx/5xx) so charts render gracefully.
 *
 * @remarks
 * Covered endpoints
 * - `GET /api/analytics/stock-value`              → { date, totalValue }[]
 * - `GET /api/analytics/monthly-stock-movement`   → { month, stockIn, stockOut }[]
 * - `GET /api/inventory`                          → top items (id + name) for dropdowns
 * - `GET /api/analytics/price-trend`              → { date, price }[]
 * - `GET /api/suppliers`                          → suppliers (id + name)
 * - `GET /api/analytics/low-stock-items`          → { itemName, quantity, minimumQuantity }[]
 * - `GET /api/analytics/stock-per-supplier`       → { supplierName, totalQuantity }[]
 */

import http from './httpClient';

// ============================================================================
// Public Types
// ============================================================================

/**
 * Optional filters accepted by most analytics endpoints.
 * Dates are ISO `YYYY-MM-DD` in local time.
 *
 * @public
 */
export type AnalyticsParams = {
  from?: string;
  to?: string;
  supplierId?: string;
};

/**
 * Canonical chart/table DTOs exposed to the UI.
 * @public
 */
export type StockValuePoint = { date: string; totalValue: number };
export type MonthlyMovement = { month: string; stockIn: number; stockOut: number };
export type PricePoint = { date: string; price: number };
export type ItemRef = { id: string; name: string };
export type SupplierRef = { id: string; name: string };
export type LowStockRow = { itemName: string; quantity: number; minimumQuantity: number };
export type StockPerSupplierPoint = { supplierName: string; totalQuantity: number };

/**
 * Optional, shared filter state (kept here for consumers that import from this module).
 * @public
 */
export type FiltersState = {
  from?: string;
  to?: string;
  supplierId?: string;
};

// ============================================================================
// Backend DTO Shims (narrow, tolerant)
// ============================================================================

/**
 * Minimal shapes the backend might return. Marked `unknown` for numeric fields
 * so we can coerce safely without `any`.
 */
type BackendStockValueDTO = { date?: string; totalValue?: unknown };
type BackendMonthlyMovementDTO = { month?: string; stockIn?: unknown; stockOut?: unknown };
type BackendPriceTrendDTO = { timestamp?: string; price?: unknown };
type BackendItemDTO = { id?: string; itemId?: string; name?: string; itemName?: string };
type BackendSupplierDTO = { id?: string | number; name?: string };
type BackendSpsDTO = { supplierId?: string | number; supplierName?: string; totalQuantity?: unknown };

// ============================================================================
// Internal Utilities (no-any, safe coercions)
// ============================================================================

/** @internal */
function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** @internal */
function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** @internal */
function asNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** @internal */
type Rec = Record<string, unknown>;

/** @internal */
function isRecord(x: unknown): x is Rec {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

/** @internal */
function isArrayOfRecords(x: unknown): x is Rec[] {
  return Array.isArray(x) && x.every(isRecord);
}

/** @internal */
function pickString(r: Rec, keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
  }
  return '';
}

/** @internal */
function pickNumber(r: Rec, keys: string[]): number {
  for (const k of keys) {
    if (k in r) return asNumber(r[k]);
  }
  return 0;
}

/**
 * Normalizes FE filter parameters to BE query params.
 * BE expects `start` / `end` (LocalDate), optional `supplierId`.
 *
 * If the caller omits dates, default to the last 180 days.
 * @internal
 */
function paramClean(p?: AnalyticsParams): Record<string, string> {
  const out: Record<string, string> = {};
  const from = p?.from ?? daysAgoIso(180);
  const to = p?.to ?? todayIso();
  out.start = from;
  out.end = to;
  if (p?.supplierId) out.supplierId = p.supplierId;
  return out;
}

// ============================================================================
// API Functions (resilient; return [] on errors)
// ============================================================================

/**
 * Fetches total inventory value over time.
 *
 * @param p - Optional date/supplier filters.
 * @returns Array of `{ date, totalValue }`, sorted by date ascending.
 * @public
 */
export async function getStockValueOverTime(p?: AnalyticsParams): Promise<StockValuePoint[]> {
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

/**
 * Fetches monthly stock movement (in/out).
 *
 * @param p - Optional date/supplier filters.
 * @returns Array of `{ month, stockIn, stockOut }`.
 * @public
 */
export async function getMonthlyStockMovement(p?: AnalyticsParams): Promise<MonthlyMovement[]> {
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

/**
 * Fetches a small list of items for price-trend dropdowns.
 *
 * @returns Array of `{ id, name }`.
 * @public
 */
export async function getTopItems(): Promise<ItemRef[]> {
  try {
    const { data } = await http.get<unknown>('/api/inventory', { params: { limit: 20 } });
    if (!Array.isArray(data)) return [];
    return (data as BackendItemDTO[])
      .map((d) => ({
        id: String(d.id ?? d.itemId ?? ''),
        name: String(d.name ?? d.itemName ?? ''),
      }))
      .filter((it) => it.id && it.name);
  } catch {
    return [];
  }
}

/**
 * Fetches an item's price trend in a time window.
 *
 * @param itemId - Required item identifier (string).
 * @param p - Optional date filters.
 * @returns Array of `{ date, price }`, sorted by date ascending.
 * @public
 */
export async function getPriceTrend(itemId: string, p?: AnalyticsParams): Promise<PricePoint[]> {
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

/**
 * Fetches a lightweight supplier list.
 *
 * @returns Array of `{ id, name }`.
 * @public
 */
export async function getSuppliersLite(): Promise<SupplierRef[]> {
  try {
    const { data } = await http.get<unknown>('/api/suppliers', { params: { limit: 200 } });
    if (!Array.isArray(data)) return [];
    return (data as BackendSupplierDTO[])
      .map((s) => ({
        id: String(s.id ?? ''),
        name: String(s.name ?? ''),
      }))
      .filter((s) => s.id && s.name);
  } catch {
    return [];
  }
}

/**
 * Fetches low-stock rows for a given supplier, optionally bounded by dates.
 *
 * @remarks
 * - Tolerates minor field variations (e.g., `name` vs `itemName`, `minQty` vs `minimumQuantity`).
 * - Returns rows **sorted by deficit (minimum - quantity) descending**.
 * - Returns `[]` if `supplierId` is empty or on any server/network error.
 *
 * @param supplierId - Required supplier identifier.
 * @param p - Optional date filters (aligned with other analytics calls).
 * @returns Array of `{ itemName, quantity, minimumQuantity }`.
 * @public
 */
export async function getLowStockItems(
  supplierId: string,
  p?: AnalyticsParams
): Promise<LowStockRow[]> {
  if (!supplierId) return [];
  try {
    const { data } = await http.get<unknown>('/api/analytics/low-stock-items', {
      params: { supplierId, ...paramClean(p) },
    });

    // Accept either a direct array or an envelope with `.items` array.
    let rawList: Rec[] = [];
    if (isArrayOfRecords(data)) {
      rawList = data;
    } else if (isRecord(data) && isArrayOfRecords(data.items)) {
      rawList = data.items;
    }

    const rows: LowStockRow[] = rawList
      .map((rec) => {
        const itemName = pickString(rec, ['itemName', 'name']);
        const quantity = pickNumber(rec, ['quantity', 'qty', 'currentQty']);
        const minimumQuantity = pickNumber(rec, ['minimumQuantity', 'minQuantity', 'minQty', 'minimum']);
        return itemName ? { itemName, quantity, minimumQuantity } : null;
      })
      .filter((x): x is LowStockRow => x !== null);

    // Sort by severity (deficit descending)
    rows.sort((a, b) => (b.minimumQuantity - b.quantity) - (a.minimumQuantity - a.quantity));
    return rows;
  } catch {
    return [];
  }
}

/**
 * Fetches a current snapshot of totals per supplier.
 * (No date filters in the current API variant.)
 *
 * @returns Array of `{ supplierName, totalQuantity }`.
 * @public
 */
export async function getStockPerSupplier(): Promise<StockPerSupplierPoint[]> {
  try {
    const { data } = await http.get<unknown>('/api/analytics/stock-per-supplier');
    if (!Array.isArray(data)) return [];
    return (data as BackendSpsDTO[])
      .map((d) => ({
        supplierName: String(d.supplierName ?? ''),
        totalQuantity: asNumber(d.totalQuantity),
      }))
      .filter((r) => r.supplierName);
  } catch {
    return [];
  }
}
