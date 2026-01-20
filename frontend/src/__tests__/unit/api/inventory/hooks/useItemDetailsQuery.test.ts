/**
 * @file useItemDetailsQuery.test.ts
 * @module tests/api/inventory/hooks/useItemDetailsQuery
 *
 * @summary
 * Exercises the full item details hook to guarantee accurate normalization and resiliency.
 * Validates encoded routing, numeric coercion, early exits, and error handling semantics.
 *
 * @enterprise
 * - Protects mission-critical forms that rely on precise quantity/price data
 * - Ensures defensive parsing keeps dialogs functional even when backend drifts
 * - Verifies logging paths so operational visibility remains intact on failures
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

describe('useItemDetailsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and normalizes complete item details', async () => {
    const mockQuery = vi.fn();
    useQueryMock.mockImplementation((config) => {
      mockQuery(config);
      return { data: undefined };
    });
    httpMock.get.mockResolvedValue({
      data: {
        id: 'ITEM-1',
        name: 'Precision Widget',
        code: 'SKU-9',
        supplierId: 42,
        onHand: '7',
        currentPrice: '19.50',
      },
    });

    const result = useItemDetailsQuery('ITEM 1');

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['itemDetails', 'ITEM 1'],
      enabled: true,
      staleTime: 30_000,
    }));

    const cfg = mockQuery.mock.calls[0][0];
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
    const mockQuery = vi.fn();
    useQueryMock.mockImplementation((config) => {
      mockQuery(config);
      return { data: undefined };
    });

    useItemDetailsQuery(null);

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    const cfg = mockQuery.mock.calls[0][0];
    await expect(cfg.queryFn()).resolves.toBeNull();
    expect(httpMock.get).not.toHaveBeenCalled();
  });

  it('logs errors and returns null when fetch fails', async () => {
    const mockQuery = vi.fn();
    useQueryMock.mockImplementation((config) => {
      mockQuery(config);
      return { data: undefined };
    });
    const failure = new Error('Request failed');
    httpMock.get.mockRejectedValue(failure);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    useItemDetailsQuery('ITEM-ERR');

    const cfg = mockQuery.mock.calls[0][0];
    await expect(cfg.queryFn()).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledWith('Failed to fetch item details:', failure);
    errorSpy.mockRestore();
  });
});
