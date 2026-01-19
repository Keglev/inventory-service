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

  it('returns false when backend rejects update', async () => {
    httpMock.patch.mockRejectedValue(new Error('denied'));

    const result = await changePrice({ id: 'ITEM-1', price: 10 });

    expect(result).toBe(false);
  });
});
