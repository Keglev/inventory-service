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
import { isRecord, pickNumber } from './util';
import type { Rec } from './util';

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
 * Fetch financial summary for a window.
 * Backend: GET /api/analytics/financial/summary?from&to[&supplierId]
 *
 * @enterprise
 * - Finance endpoint uses `from/to` (not `start/end` like other analytics).
 * - Accepts either a direct object or an envelope (e.g., { summary } or { data }).
 * - Returns a fully-populated zero object on any error.
 */
export async function getFinancialSummary(
  p?: { from?: string; to?: string; supplierId?: string }
): Promise<FinancialSummary> {
  try {
    const params: Record<string, string> = {};
    if (p?.from) params.from = p.from;
    if (p?.to) params.to = p.to;
    if (p?.supplierId) params.supplierId = p.supplierId;

    const { data } = await http.get<unknown>('/api/analytics/financial/summary', { params });

    // Accept direct object or envelope
    const pickPayload = (x: unknown): Rec | null => {
      if (!isRecord(x)) return null;
      if (isRecord(x.summary)) return x.summary as Rec;
      if (isRecord(x.data)) return x.data as Rec;
      return x as Rec;
    };

    const body = pickPayload(data);
    if (!body) return ZERO_FINANCE;

    return {
        purchases:    pickNumber(body, ['purchases', 'purchasesCost', 'totalPurchases', 'purchaseTotal']),
        cogs:         pickNumber(body, ['cogs', 'cogsCost', 'costOfGoodsSold']),
        writeOffs:    pickNumber(body, ['writeOffs', 'writeOffCost', 'writeoffs', 'write_offs']),
        returns:      pickNumber(body, ['returns', 'returnsInCost', 'returnsCost', 'salesReturns', 'returnsTotal']),
        openingValue: pickNumber(body, ['openingValue', 'opening', 'startValue']),
        endingValue:  pickNumber(body, ['endingValue', 'ending', 'endValue']),
    };

  } catch {
    return ZERO_FINANCE;
  }
}


