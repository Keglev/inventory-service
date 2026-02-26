/**
 * @file priceMutations.test.ts
 * @module tests/unit/api/inventory/priceMutations
 * @what_is_under_test changePrice
 * @responsibility
 * Guarantees the price mutation contract: correct URL encoding + route composition for the
 * PATCH request, and a boolean success/failure surface for callers.
 * @out_of_scope
 * Server-side validation rules and error payload semantics (this unit only asserts boolean results).
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
import { changePrice, INVENTORY_BASE } from '../../../../api/inventory/priceMutations';

type HttpMock = {
  patch: ReturnType<typeof vi.fn>;
};

const httpMock = http as unknown as HttpMock;

describe('changePrice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success paths', () => {
    it('updates price via encoded PATCH request', async () => {
      httpMock.patch.mockResolvedValue({});

      const result = await changePrice({ id: 'ITEM 1', price: 29.99 });

      expect(httpMock.patch).toHaveBeenCalledWith(
        `${INVENTORY_BASE}/ITEM%201/price`,
        null,
        { params: { price: 29.99 } }
      );
      expect(result).toBe(true);
    });
  });

  describe('failure paths', () => {
    it('returns false when backend rejects update', async () => {
      httpMock.patch.mockRejectedValue(new Error('denied'));

      const result = await changePrice({ id: 'ITEM-1', price: 10 });

      expect(result).toBe(false);
    });
  });
});
