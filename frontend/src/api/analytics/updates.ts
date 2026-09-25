/**
 * @module api/analytics/updates
 *
 * Stock updates from GET /api/analytics/stock-updates (the full list) and
 * GET /api/analytics/stock-updates/page (one page with the total).
 * Each record is mapped tolerantly (multiple fallback field names) so minor
 * backend renames do not break the UI. Returns an empty array on any error.
 */
import http from '../httpClient';
import { isArrayOfRecords, pickString, pickNumber } from './util';
import type { Rec } from './util';

export type StockUpdateRow = {
    timestamp: string; // ISO or displayable string
    itemName: string;
    delta: number; // +/- quantity change
    reason?: string;
    user?: string;
};

export type StockUpdatesFilter = {
    from?: string;
    to?: string;
    supplierId?: string;
    itemName?: string;
    limit?: number;
};
/**
 * GET /api/analytics/stock-updates?startDate&endDate[&supplierId][&itemName]
 *
 * Fetches recent stock updates with tolerant field mapping so backend renames
 * don't break the UI. `limit` is included in the request but is not a declared
 * backend parameter and will be silently ignored.
 * Returns an empty array when the response is missing or malformed.
 * @param filter - Optional date range, supplier, item name, and result-count hint
 * @returns Array of stock update rows, empty on errors
 * @example
 * ```typescript
 * const updates = await getStockUpdates({
 *   from: '2025-10-01',
 *   to: '2025-10-31',
 *   supplierId: 'SUP-001',
 *   itemName: 'Widget',
 *   limit: 100
 * });
 * return <Table data={updates} />;
 * ```
 */
export async function getStockUpdates(filter?: StockUpdatesFilter): Promise<StockUpdateRow[]> {
    try {
        const params: Record<string, string | number | undefined> = {
            ...windowParams(filter),
            limit: filter?.limit ?? 50,
        };

        const { data } = await http.get<unknown>('/api/analytics/stock-updates', { params });
        if (!isArrayOfRecords(data)) return [];
        return (data as Rec[])
            .map(toStockUpdateRow)
            .filter((x): x is StockUpdateRow => x !== null);
    } catch {
        return [];
    }
}

export type StockUpdatesPageFilter = Omit<StockUpdatesFilter, 'limit'> & {
    /** Zero-based page index. */
    page?: number;
    /** Rows per page; the backend caps it at 100. */
    size?: number;
};

export type StockUpdatesPage = {
    rows: StockUpdateRow[];
    /** Number of matching rows across all pages. */
    total: number;
};

/**
 * GET /api/analytics/stock-updates/page?startDate&endDate[&supplierId][&itemName]&page&size
 *
 * One page of the rows {@link getStockUpdates} returns, newest first, with the
 * total count from the Spring Data page. Returns an empty page when the
 * response is missing or malformed.
 * @param filter - Optional date range, supplier and item name, plus page and size
 * @returns The page's rows and the total number of matching rows
 */
export async function getStockUpdatesPage(filter?: StockUpdatesPageFilter): Promise<StockUpdatesPage> {
    try {
        const params: Record<string, string | number | undefined> = {
            ...windowParams(filter),
            page: filter?.page ?? 0,
            size: filter?.size ?? 10,
        };

        const { data } = await http.get<unknown>('/api/analytics/stock-updates/page', { params });
        if (typeof data !== 'object' || data === null) return { rows: [], total: 0 };

        const record = data as Rec;
        if (!isArrayOfRecords(record.content)) return { rows: [], total: 0 };

        const rows = (record.content as Rec[])
            .map(toStockUpdateRow)
            .filter((x): x is StockUpdateRow => x !== null);
        return { rows, total: pickNumber(record, ['totalElements']) };
    } catch {
        return { rows: [], total: 0 };
    }
}

/** Date window, supplier and item name as the backend's query parameters. */
function windowParams(filter?: Omit<StockUpdatesFilter, 'limit'>): Record<string, string | undefined> {
    const buildDateTime = (date?: string | null, opts?: { endOfDay?: boolean }) => {
        if (!date) return undefined;
        const suffix = opts?.endOfDay ? 'T23:59:59' : 'T00:00:00';
        return `${date}${suffix}`;
    };

    return {
        startDate: buildDateTime(filter?.from ?? undefined),
        endDate: buildDateTime(filter?.to ?? undefined, { endOfDay: true }),
        supplierId: filter?.supplierId || undefined,
        itemName: filter?.itemName || undefined,
    };
}

/** Maps one backend record tolerantly; a record without timestamp or item name is dropped. */
function toStockUpdateRow(rec: Rec): StockUpdateRow | null {
    const timestamp = pickString(rec, ['timestamp', 'createdAt', 'date', 'time']);
    const itemName = pickString(rec, ['itemName', 'name']);
    if (!timestamp || !itemName) return null;

    const reason = pickString(rec, ['reason', 'note', 'type']);
    const user = pickString(rec, ['user', 'username', 'performedBy', 'createdBy']);
    return {
        timestamp,
        itemName,
        delta: pickNumber(rec, ['delta', 'quantityChange', 'change']),
        reason: reason || undefined,
        user: user || undefined,
    };
}
