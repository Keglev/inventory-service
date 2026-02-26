/**
 * @file stockMutations.test.ts
 * @module tests/unit/api/inventory/stockMutations
 * @what_is_under_test adjustQuantity
 * @responsibility
 * Guarantees the stock adjustment mutation contract: URL encoding + route composition for the
 * PATCH request and a boolean success/failure surface for callers.
 * @out_of_scope
 * Backend validation and domain rules (e.g., negative stock policies, reason enforcement).
 * @out_of_scope
 * HTTP client behavior (interceptors, retries, auth headers, and transport concerns).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    patch: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { adjustQuantity, INVENTORY_BASE } from '../../../../api/inventory/stockMutations';

type HttpMock = {
  patch: ReturnType<typeof vi.fn>;
};

const httpMock = http as unknown as HttpMock;

describe('adjustQuantity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success paths', () => {
    it('sends encoded quantity adjustment request', async () => {
      httpMock.patch.mockResolvedValue({});

      const result = await adjustQuantity({ id: 'ITEM 1', delta: -5, reason: 'CORRECTION' });

      expect(httpMock.patch).toHaveBeenCalledWith(
        `${INVENTORY_BASE}/ITEM%201/quantity`,
        null,
        { params: { delta: -5, reason: 'CORRECTION' } }
      );
      expect(result).toBe(true);
    });
  });

  describe('failure paths', () => {
    it('returns false when backend rejects adjustment', async () => {
      httpMock.patch.mockRejectedValue(new Error('bad request'));

      const result = await adjustQuantity({ id: 'ITEM-1', delta: 10, reason: 'PURCHASE' });

      expect(result).toBe(false);
    });
  });
});
