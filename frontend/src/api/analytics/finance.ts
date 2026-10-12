/**
 * @module api/analytics/finance
 *
 * Fetches WAC-based (weighted-average-cost) financial figures for a given date window and optional supplier.
 * Calls GET /api/analytics/financial/summary with `from`/`to` params (not
 * the `start`/`end` used by other analytics endpoints). The body is the bare
 * FinancialSummaryDTO; the backend wraps it in no envelope.
 * Numeric fields default to 0 and `method` to '' on missing or invalid data;
 * the function never throws.
 */

import http from '../httpClient';
import { firstNumberOrZero, firstStringOrEmpty } from './util';
import { isRecord } from '../shared/typeGuards';
import type { Rec } from './util';

/**
 * Canonical frontend shape for a financial summary period.
 * Amounts are guaranteed numbers (0 when absent or unparseable); `method` is
 * the costing method the backend used ('' when absent).
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
    /** Costing method of the amounts, e.g. "WAC" (weighted average cost); '' when absent. */
    method: string;
};

/** @internal */
const ZERO_FINANCE: FinancialSummary = {
    purchases: 0,
    cogs: 0,
    writeOffs: 0,
    returns: 0,
    openingValue: 0,
    endingValue: 0,
    method: '',
};

/**
 * Fetch financial summary for a date window.
 * Backend: GET /api/analytics/financial/summary?from&to[&supplierId]
 * Returns `ZERO_FINANCE` on network errors or unrecognised response shapes.
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

    if (!isRecord(data)) return ZERO_FINANCE;
    const body = data as Rec;

    return {
        // FinancialSummaryDTO field names; the backend sends no other spelling.
        purchases:    firstNumberOrZero(body, ['purchasesCost']),
        cogs:         firstNumberOrZero(body, ['cogsCost']),
        writeOffs:    firstNumberOrZero(body, ['writeOffCost']),
        returns:      firstNumberOrZero(body, ['returnsInCost']),
        openingValue: firstNumberOrZero(body, ['openingValue']),
        endingValue:  firstNumberOrZero(body, ['endingValue']),
        method:       firstStringOrEmpty(body, ['method']),
    };

  } catch {
    return ZERO_FINANCE;
  }
}
