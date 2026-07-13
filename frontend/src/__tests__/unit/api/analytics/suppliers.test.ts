/**
 * @file suppliers.test.ts
 * @module __tests__/unit/api/analytics/suppliers
 * @description Request contract + defensive parsing for the lightweight
 * supplier-dropdown fetcher.
 *
 * Contract under test:
 * - Calls GET /api/suppliers with limit=200.
 * - Maps raw entries to string {id, name} pairs.
 * - Filters entries missing id or name after coercion.
 * - Returns [] on non-array payloads and on transport errors (graceful degrade).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { getSuppliersLite } from '../../../../api/analytics/suppliers';

describe('api/analytics/suppliers getSuppliersLite', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpGet.mockReset();
  });

  it('requests GET /api/suppliers with the capped limit', async () => {
    httpGet.mockResolvedValue({ data: [] });

    await getSuppliersLite();

    expect(httpGet).toHaveBeenCalledWith('/api/suppliers', { params: { limit: 200 } });
  });

  it('maps entries to string id/name pairs', async () => {
    httpGet.mockResolvedValue({
      data: [
        { id: 7, name: 'Alpha' },
        { id: 'sup-2', name: 'Beta' },
      ],
    });

    await expect(getSuppliersLite()).resolves.toEqual([
      { id: '7', name: 'Alpha' },
      { id: 'sup-2', name: 'Beta' },
    ]);
  });

  it('drops entries with a missing id or name', async () => {
    httpGet.mockResolvedValue({
      data: [
        { id: 1, name: 'Kept' },
        { name: 'No id' },
        { id: 2 },
        { id: '', name: 'Empty id' },
      ],
    });

    await expect(getSuppliersLite()).resolves.toEqual([{ id: '1', name: 'Kept' }]);
  });

  it('returns an empty list when the payload is not an array', async () => {
    httpGet.mockResolvedValue({ data: { items: [] } });

    await expect(getSuppliersLite()).resolves.toEqual([]);
  });

  it('returns an empty list when the request rejects', async () => {
    httpGet.mockRejectedValue(new Error('network down'));

    await expect(getSuppliersLite()).resolves.toEqual([]);
  });
});
