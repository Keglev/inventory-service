/**
 * @file useItemPriceQuery.test.ts
 *
 * @what_is_under_test useItemPriceQuery hook
 * @responsibility Fetch the most recent item price with sensible fallbacks
 * @out_of_scope React Query internals, analytics API transport
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import type { ItemOption } from '../../../../../api/analytics/types';
import { useItemPriceQuery } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useItemPriceQuery';

vi.mock('../../../../../api/analytics/priceTrend', () => ({
  getPriceTrend: vi.fn(),
}));

import { getPriceTrend } from '../../../../../api/analytics/priceTrend';

const getPriceTrendMock = vi.mocked(getPriceTrend);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient, children });

  return { Wrapper, queryClient };
};

const baseItem: ItemOption = {
  id: 'item-1',
  name: 'Sterile Gloves',
  supplierId: 'sup-1',
  onHand: 10,
  price: 12,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useItemPriceQuery', () => {
  it('returns latest price from price trend data', async () => {
    getPriceTrendMock.mockResolvedValue([
      { date: '2024-01-01', price: 11 },
      { date: '2024-02-01', price: 13 },
    ]);
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useItemPriceQuery(baseItem, 'sup-1'),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(13);
    });

    expect(getPriceTrendMock).toHaveBeenCalledWith('item-1', { supplierId: 'sup-1' });
    queryClient.clear();
  });

  it('falls back to item price when trend is empty', async () => {
    getPriceTrendMock.mockResolvedValue([]);
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useItemPriceQuery(baseItem, undefined),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(baseItem.price);
    });

    queryClient.clear();
  });

  it('recovers from errors and logs failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPriceTrendMock.mockRejectedValue(new Error('network down'));
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useItemPriceQuery(baseItem, 'sup-9'),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBe(baseItem.price);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    queryClient.clear();
  });

  it('does not execute query when item is not selected', async () => {
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useItemPriceQuery(null, undefined),
      { wrapper: Wrapper }
    );

    expect(result.current.data).toBeUndefined();
    expect(getPriceTrendMock).not.toHaveBeenCalled();

    queryClient.clear();
  });
});
