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

  it('returns false when backend rejects adjustment', async () => {
    httpMock.patch.mockRejectedValue(new Error('bad request'));

    const result = await adjustQuantity({ id: 'ITEM-1', delta: 10, reason: 'PURCHASE' });

    expect(result).toBe(false);
  });
});
