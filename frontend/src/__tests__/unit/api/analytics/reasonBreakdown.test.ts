/**
 * @file reasonBreakdown.test.ts
 * @module __tests__/unit/api/analytics/reasonBreakdown
 * @description Request contract + tolerant parsing for the per-reason movement
 * breakdown fetcher.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { getReasonBreakdown } from '../../../../api/analytics/reasonBreakdown';

describe('api/analytics/reasonBreakdown.getReasonBreakdown', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends ISO DATE bounds and optional filters as-is (no time suffix)', async () => {
    httpGet.mockResolvedValueOnce({ data: [] });

    await getReasonBreakdown({
      from: '2026-01-01',
      to: '2026-06-30',
      supplierId: 'SUP-001',
      itemName: 'Bearing',
    });

    expect(httpGet).toHaveBeenCalledWith('/api/analytics/reason-breakdown', {
      params: {
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        supplierId: 'SUP-001',
        itemName: 'Bearing',
      },
    });
  });

  it('maps rows and keeps sign-split values (a reason can carry both sides)', async () => {
    httpGet.mockResolvedValueOnce({
      data: [
        { reason: 'MANUAL_UPDATE', increase: 5, decrease: 3 },
        { reason: 'SOLD', increase: 0, decrease: 7 },
      ],
    });

    const rows = await getReasonBreakdown();

    expect(rows).toEqual([
      { reason: 'MANUAL_UPDATE', increase: 5, decrease: 3 },
      { reason: 'SOLD', increase: 0, decrease: 7 },
    ]);
  });

  it('drops malformed rows and returns [] on non-array payloads', async () => {
    httpGet.mockResolvedValueOnce({
      data: [{ increase: 5, decrease: 0 }, { reason: 'LOST', increase: 0, decrease: 2 }],
    });
    expect(await getReasonBreakdown()).toEqual([{ reason: 'LOST', increase: 0, decrease: 2 }]);

    httpGet.mockResolvedValueOnce({ data: { unexpected: true } });
    expect(await getReasonBreakdown()).toEqual([]);
  });

  it('returns [] when the request throws', async () => {
    httpGet.mockRejectedValueOnce(new Error('network'));
    expect(await getReasonBreakdown()).toEqual([]);
  });
});
