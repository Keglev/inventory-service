/**
* @file updates.ts
* @module api/analytics/updates
*
* @summary
* Recent stock updates table. Uses tolerant field mapping so small BE changes
* don't break the UI. Returns an array (empty on errors).
*/
import http from '../httpClient';
import { isArrayOfRecords, pickString, pickNumber } from './util';
import type { Rec } from './util';

export type StockUpdateRow = {
    timestamp: string; // ISO or displayable string
    itemName: string;
    delta: number; // +/− quantity change
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
/** GET /api/analytics/stock-updates?start&end[&supplierId][&itemName][&limit] */
export async function getStockUpdates(filter?: StockUpdatesFilter): Promise<StockUpdateRow[]> {
    try {
        const buildDateTime = (date?: string | null, opts?: { endOfDay?: boolean }) => {
            if (!date) return undefined;
            const suffix = opts?.endOfDay ? 'T23:59:59' : 'T00:00:00';
            return `${date}${suffix}`;
        };

        const params: Record<string, string | number | undefined> = {
            startDate: buildDateTime(filter?.from ?? undefined),
            endDate: buildDateTime(filter?.to ?? undefined, { endOfDay: true }),
            supplierId: filter?.supplierId || undefined,
            itemName: filter?.itemName || undefined,
            limit: filter?.limit ?? 50,
        };
        const { data } = await http.get<unknown>('/api/analytics/stock-updates', { params });
        if (!isArrayOfRecords(data)) return [];
        const rows = (data as Rec[])
            .map<StockUpdateRow | null>((rec) => {
                const timestamp = pickString(rec, ['timestamp', 'createdAt', 'date', 'time']);
                const itemName = pickString(rec, ['itemName', 'name']);
                if (!timestamp || !itemName) return null;
            
                const delta = pickNumber(rec, ['delta', 'quantityChange', 'change']);
                const reason = pickString(rec, ['reason', 'note', 'type']);
                const user = pickString(rec, ['user', 'username', 'performedBy', 'createdBy']);

                // Build a value conforming to StockUpdateRow (optional fields included only as needed)
                const row: StockUpdateRow = {
                    timestamp,
                    itemName,
                    delta,
                    reason: reason || undefined,
                    user: user || undefined,
                };
                return row;
            })
            .filter((x): x is StockUpdateRow => x !== null);
        
        return rows;
        
    } catch {
        return [];
    }
}