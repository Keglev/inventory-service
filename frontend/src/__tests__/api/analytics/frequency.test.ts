/**
 * @file frequency.test.ts
 * @module __tests__/api/analytics/frequency
 * @description Contract tests for getItemUpdateFrequency (api/analytics/frequency).
 *
 * Contract under test:
 * - Guarantees supplierId is required for an HTTP call (empty supplierId
 *   short-circuits)
 * - Guarantees tolerant parsing/normalization of supported response
 *   shapes into a stable DTO list
 * - Guarantees transport failures result in a safe empty list
 *
 * Out of scope:
 * - Backend ranking semantics, pagination, and any statistical
 *   interpretation of "frequency"
 * - HTTP client behavior (timeouts, retries, base URL, interceptors)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the http client used by frequency.ts
vi.mock('@/api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '@/api/httpClient';
import { getItemUpdateFrequency } from '@/api/analytics/frequency';

describe('api/analytics/frequency.getItemUpdateFrequency', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input gating', () => {
    it('returns [] when supplierId is empty (no http call)', async () => {
      const supplierId = '';

      const res = await getItemUpdateFrequency(supplierId);

      expect(res).toEqual([]);
      expect(httpGet).not.toHaveBeenCalled();
    });
  });

  describe('response normalization', () => {
    it('returns [] when response is not an array of records', async () => {
      httpGet.mockResolvedValueOnce({ data: { nope: true } });

      const res = await getItemUpdateFrequency('SUP-001');

      expect(res).toEqual([]);
    });

    it('maps ItemUpdateFrequencyDTO and keys each row by its item name', async () => {
      // The DTO is (itemName, updateCount) and has no id.
      httpGet.mockResolvedValueOnce({
        data: [
          { itemName: 'Item A', updateCount: 3 },
          { itemName: 'Item B', updateCount: 5 },
          { itemName: 'Item C', updateCount: '7' },
        ],
      });

      const res = await getItemUpdateFrequency('SUP-001', 10);

      expect(httpGet).toHaveBeenCalledTimes(1);
      expect(httpGet).toHaveBeenCalledWith('/api/analytics/item-update-frequency', {
        params: { supplierId: 'SUP-001' },
      });

      expect(res).toEqual([
        { id: 'Item A', name: 'Item A', updates: 3 },
        { id: 'Item B', name: 'Item B', updates: 5 },
        { id: 'Item C', name: 'Item C', updates: 7 },
      ]);
    });

    it('filters out records without a name', async () => {
      httpGet.mockResolvedValueOnce({
        data: [
          { updateCount: 1 },
          { itemName: 'Good', updateCount: 2 },
        ],
      });

      const res = await getItemUpdateFrequency('SUP-001', 10);

      expect(res).toEqual([{ id: 'Good', name: 'Good', updates: 2 }]);
    });

    it('applies limit by slicing after parsing', async () => {
      httpGet.mockResolvedValueOnce({
        data: [
          { itemName: 'A', updateCount: 1 },
          { itemName: 'B', updateCount: 2 },
          { itemName: 'C', updateCount: 3 },
        ],
      });

      const res = await getItemUpdateFrequency('SUP-001', 2);

      expect(res).toEqual([
        { id: 'A', name: 'A', updates: 1 },
        { id: 'B', name: 'B', updates: 2 },
      ]);
    });
  });

  describe('transport failures', () => {
    it('returns [] when http throws', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getItemUpdateFrequency('SUP-001');

      expect(res).toEqual([]);
    });
  });
});
