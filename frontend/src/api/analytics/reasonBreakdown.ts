/**
 * @file reasonBreakdown.ts
 * @module api/analytics/reasonBreakdown
 *
 * @summary
 * Fetcher for GET /api/analytics/reason-breakdown: per-reason stock movement
 * totals, sign-split into increase (positive changes) and decrease (absolute
 * value of negative changes). A reason can carry both sides at once
 * (e.g. MANUAL_UPDATE corrections in both directions).
 *
 * @enterprise
 * - The endpoint accepts ISO DATE bounds (yyyy-MM-dd), not date-times;
 *   the backend widens them to full-day timestamps itself.
 * - Tolerant parsing per the analytics API house style: malformed rows are
 *   dropped, transport errors collapse to an empty list (cards render their
 *   own empty state).
 */
import http from '../httpClient';
import { isArrayOfRecords, pickString, pickNumber } from './util';
import type { Rec } from './util';

/** One aggregated row per stock-change reason. */
export type ReasonBreakdownRow = {
    /** Backend enum name, e.g. 'SOLD' or 'MANUAL_UPDATE'. */
    reason: string;
    /** Total units added under this reason (sum of positive changes). */
    increase: number;
    /** Total units removed under this reason (absolute sum of negative changes). */
    decrease: number;
};

export type ReasonBreakdownFilter = {
    /** ISO date (YYYY-MM-DD) lower bound. */
    from?: string;
    /** ISO date (YYYY-MM-DD) upper bound. */
    to?: string;
    /** Optional supplier filter. */
    supplierId?: string;
    /** Optional partial item name (case-insensitive on the backend). */
    itemName?: string;
};

/**
 * Loads the per-reason movement breakdown for the given window and filters.
 *
 * @param filter optional window/supplier/item filters
 * @returns rows ordered by reason (backend order); empty list on error
 */
export async function getReasonBreakdown(filter?: ReasonBreakdownFilter): Promise<ReasonBreakdownRow[]> {
    try {
        const params: Record<string, string | undefined> = {
            startDate: filter?.from || undefined,
            endDate: filter?.to || undefined,
            supplierId: filter?.supplierId || undefined,
            itemName: filter?.itemName || undefined,
        };

        const { data } = await http.get<unknown>('/api/analytics/reason-breakdown', { params });
        if (!isArrayOfRecords(data)) return [];

        return (data as Rec[])
            .map<ReasonBreakdownRow | null>((rec) => {
                const reason = pickString(rec, ['reason']);
                if (!reason) return null;
                return {
                    reason,
                    increase: pickNumber(rec, ['increase']),
                    decrease: pickNumber(rec, ['decrease']),
                };
            })
            .filter((x): x is ReasonBreakdownRow => x !== null);
    } catch {
        return [];
    }
}
