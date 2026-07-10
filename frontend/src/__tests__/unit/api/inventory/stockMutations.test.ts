/**
 * @file stockMutations.test.ts
 * @module tests/unit/api/inventory/stockMutations
 * @what_is_under_test adjustQuantity
 * @responsibility
 * Guarantees the stock adjustment mutation contract: URL encoding + route composition for the
 * PATCH request, and a structured success/failure surface ({ ok, error, errorToken, status }).
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
import { adjustQuantity } from '../../../../api/inventory/stockMutations';
import { INVENTORY_BASE } from '../../../../api/shared/constants';

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
      expect(result).toEqual({ ok: true });
    });
  });

  describe('failure paths', () => {
    it('returns a generic failure envelope for non-HTTP errors', async () => {
      httpMock.patch.mockRejectedValue(new Error('bad request'));

      const result = await adjustQuantity({ id: 'ITEM-1', delta: 10, reason: 'PURCHASE' });

      expect(result).toEqual({ ok: false, error: 'bad request', errorToken: null, status: null });
    });

    it('surfaces the backend status token on HTTP rejection', async () => {
      httpMock.patch.mockRejectedValue({
        response: {
          status: 422,
          data: {
            error: 'unprocessable_entity',
            message: 'Resulting stock cannot be negative',
            timestamp: '2026-07-02T00:00:00Z',
          },
        },
      });

      const result = await adjustQuantity({ id: 'ITEM-1', delta: -50, reason: 'SOLD' });

      expect(result).toEqual({
        ok: false,
        error: 'Resulting stock cannot be negative',
        errorToken: 'unprocessable_entity',
        status: 422,
      });
    });
  });
});
