/**
* @file finance.ts
* @module api/analytics/finance
*
* @summary
* Financial analytics (WAC-based) for a given date window and optional supplier.
* Tolerant parsing: unknown/missing fields → 0. Functions never throw; callers
* get a fully-populated object with zeros on error to keep the UI resilient.
*/


import http from '../httpClient';
import { paramClean, isRecord, pickNumber } from './util';

/** Canonical FE shape for financial summary (numbers are always defined). */
export type FinancialSummary = {
    purchases: number;
    cogs: number;
    writeOffs: number;
    returns: number;
    openingValue: number;
    endingValue: number;
};

/** Zero object for graceful fallbacks. */
const ZERO_FINANCE: FinancialSummary = {
    purchases: 0,
    cogs: 0,
    writeOffs: 0,
    returns: 0,
    openingValue: 0,
    endingValue: 0,
};

/**
* Fetch financial summary for a window. Backend endpoint:
* GET /api/analytics/financial/summary?start&end[&supplierId]
*/
export async function getFinancialSummary(p?: { from?: string; to?: string; supplierId?: string }): Promise<FinancialSummary> {
    try {
        const { data } = await http.get<unknown>('/api/analytics/financial/summary', { params: paramClean(p) });
        if (!isRecord(data)) return ZERO_FINANCE;
        return {
            purchases: pickNumber(data, ['purchases', 'totalPurchases', 'purchaseTotal']),
            cogs: pickNumber(data, ['cogs', 'costOfGoodsSold']),
            writeOffs: pickNumber(data, ['writeOffs', 'writeoffs', 'write_offs']),
            returns: pickNumber(data, ['returns', 'salesReturns', 'returnsTotal']),
            openingValue: pickNumber(data, ['openingValue', 'opening', 'startValue']),
            endingValue: pickNumber(data, ['endingValue', 'ending', 'endValue']),
        } satisfies FinancialSummary;
    } catch {
        return ZERO_FINANCE;
    }
}
