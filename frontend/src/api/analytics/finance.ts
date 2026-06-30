/**
 * @module api/analytics/finance
 *
 * Fetches WAC-based (weighted-average-cost) financial figures for a given date window and optional supplier.
 * Calls GET /api/analytics/financial/summary with `from`/`to` params (not
 * the `start`/`end` used by other analytics endpoints). Accepts response
 * bodies as a direct object or as `{ summary }` / `{ data }` envelopes.
 * All fields default to 0 on missing or invalid data; the function never throws.
 */

import http from '../httpClient';
import { pickNumber } from './util';
import { isRecord } from '@/api/shared';
import type { Rec } from './util';

/**
 * Canonical frontend shape for a financial summary period.
 * All fields are guaranteed numbers (0 when absent or unparseable).
 * @example
 * ```typescript
 * const summary = await getFinancialSummary({
 *   from: '2025-09-01',
 *   to: '2025-11-30',
 *   supplierId: 'SUP-001'
 * });
 * return <FinanceDashboard data={summary} />;
 * ```
 */
export type FinancialSummary = {
    purchases: number;
    cogs: number;
    writeOffs: number;
    returns: number;
    openingValue: number;
    endingValue: number;
};

/** @internal */
const ZERO_FINANCE: FinancialSummary = {
    purchases: 0,
    cogs: 0,
    writeOffs: 0,
    returns: 0,
    openingValue: 0,
    endingValue: 0,
};

/**
 * Fetch financial summary for a date window.
 * Backend: GET /api/analytics/financial/summary?from&to[&supplierId]
 * Returns {@link ZERO_FINANCE} on network errors or unrecognised response shapes.
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
