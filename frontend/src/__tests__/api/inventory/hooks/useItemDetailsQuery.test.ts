/**
 * @file useItemDetailsQuery.test.ts
 * @module tests/unit/api/inventory/hooks/useItemDetailsQuery
 * @description Contract tests for useItemDetailsQuery.
 *
 * Contract under test:
 * - Guarantees the hook's public contract: query configuration, URL
 *   encoding, DTO normalization, and resilience (safe null returns +
 *   logging) when the fetch path fails.
 *
 * Out of scope:
 * - Network layer correctness (axios/fetch implementation, interceptors,
 *   headers, timeouts).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import { useQuery } from '@tanstack/react-query';
import http from '@/api/httpClient';
import { useItemDetailsQuery } from '@/api/inventory/hooks/useItemDetailsQuery';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const httpMock = http as unknown as { get: ReturnType<typeof vi.fn> };

function arrangeUseQueryConfigCapture() {
  useQueryMock.mockImplementation(() => ({ data: undefined }));
}

describe('useItemDetailsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and normalizes complete item details', async () => {
    arrangeUseQueryConfigCapture();
    httpMock.get.mockResolvedValue({
      data: {
        id: 'ITEM-1',
        name: 'Precision Widget',
        code: 'SKU-9',
        supplierId: 42,
        quantity: '7',
        price: '19.50',
      },
    });

    const result = useItemDetailsQuery('ITEM 1');

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['itemDetails', 'ITEM 1'],
      enabled: true,
      staleTime: 30_000,
    }));

    const cfg = useQueryMock.mock.calls[0][0];
    const details = await cfg.queryFn();

    expect(httpMock.get).toHaveBeenCalledWith('/api/inventory/ITEM%201');
    expect(details).toEqual({
      id: 'ITEM-1',
      name: 'Precision Widget',
      code: 'SKU-9',
      supplierId: 42,
      price: 19.5,
      onHand: 7,
    });
    expect(result).toEqual({ data: undefined });
  });

  it('returns null immediately when item id is missing', async () => {
    arrangeUseQueryConfigCapture();

    useItemDetailsQuery(null);

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    const cfg = useQueryMock.mock.calls[0][0];
    await expect(cfg.queryFn()).resolves.toBeNull();
    expect(httpMock.get).not.toHaveBeenCalled();
  });

  it('accepts a bare record response without the axios data wrapper shape', async () => {
    arrangeUseQueryConfigCapture();
    // The mapper tolerates a payload whose data key is absent by treating
    // the record itself as the DTO.
    httpMock.get.mockResolvedValue({
      id: 7,
      name: 'Bare Widget',
      supplierId: 'sup-1',
      quantity: 3,
      price: 2,
    });

    useItemDetailsQuery('ITEM-2');

    const cfg = useQueryMock.mock.calls[0][0];
    const details = await cfg.queryFn();

    expect(details).toEqual({
      id: '7',
      name: 'Bare Widget',
      code: null,
      supplierId: 'sup-1',
      price: 2,
      onHand: 3,
    });
  });

  it('degrades a non-record response to empty defaults', async () => {
    arrangeUseQueryConfigCapture();
    httpMock.get.mockResolvedValue('totally-not-json');

    useItemDetailsQuery('ITEM-3');

    const cfg = useQueryMock.mock.calls[0][0];
    const details = await cfg.queryFn();

    expect(details).toEqual({
      id: '',
      name: '',
      code: null,
      supplierId: null,
      price: 0,
      onHand: 0,
    });
  });

  it('nulls out invalid field types instead of passing them through', async () => {
    arrangeUseQueryConfigCapture();
    httpMock.get.mockResolvedValue({
      data: {
        id: 'ITEM-4',
        name: 123,
        code: 99,
        supplierId: { nested: true },
        quantity: 'abc',
      },
    });

    useItemDetailsQuery('ITEM-4');

    const cfg = useQueryMock.mock.calls[0][0];
    const details = await cfg.queryFn();

    expect(details).toEqual({
      id: 'ITEM-4',
      name: '',
      code: null,
      supplierId: null,
      price: 0,
      onHand: 0,
    });
  });

  it('logs errors and returns null when fetch fails', async () => {
    arrangeUseQueryConfigCapture();
    const failure = new Error('Request failed');
    httpMock.get.mockRejectedValue(failure);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    useItemDetailsQuery('ITEM-ERR');

    const cfg = useQueryMock.mock.calls[0][0];
    await expect(cfg.queryFn()).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledWith('Failed to fetch item details:', failure);
    errorSpy.mockRestore();
  });
});
