/**
* @file stock.ts
* @module api/analytics/stock
*
* @summary
* Stock value time series and monthly movement endpoints.
* Functions are resilient and return `[]` on any error to keep charts rendering.
*/
import http from '../httpClient';
import { asNumber, paramClean } from './util';
import type { AnalyticsParams, StockValuePoint, MonthlyMovement, StockPerSupplierPoint } from './types';

// Backend DTO shims (tolerant, local to this module)
type BackendStockValueDTO = { date?: string; totalValue?: unknown };
type BackendMonthlyMovementDTO = { month?: string; stockIn?: unknown; stockOut?: unknown };


/** Fetch total inventory value over time. */
export async function getStockValueOverTime(p?: AnalyticsParams): Promise<StockValuePoint[]> {
    try {
        const { data } = await http.get<unknown>('/api/analytics/stock-value', { params: paramClean(p) });
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

/** Fetch monthly stock movement (in/out). */
export async function getMonthlyStockMovement(p?: AnalyticsParams): Promise<MonthlyMovement[]> {
    try {
        const { data } = await http.get<unknown>('/api/analytics/monthly-stock-movement', { params: paramClean(p) });
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

/** Fetch a current snapshot of totals per supplier. (No date filters.) */
export async function getStockPerSupplier(): Promise<StockPerSupplierPoint[]> {
    try {
        const { data } = await http.get<unknown>('/api/analytics/stock-per-supplier');
        if (!Array.isArray(data)) return [];
        return (data as Array<{ supplierName?: string; totalQuantity?: unknown }>)
        .map((d) => ({ supplierName: String(d.supplierName ?? ''), totalQuantity: asNumber(d.totalQuantity) }))
        .filter((r) => r.supplierName);
    } catch {
        return [];
    }
}

export type { StockValuePoint, MonthlyMovement } from './types';