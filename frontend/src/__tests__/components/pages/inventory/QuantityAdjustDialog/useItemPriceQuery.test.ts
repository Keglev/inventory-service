/**
 * @file useItemPriceQuery.test.ts
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/useItemPriceQuery
 * @description Contract tests for useItemPriceQuery:
 * - Returns the latest price from trend data when available.
 * - Falls back to the item's current price when trend is empty.
 * - Recovers from errors by logging and returning the fallback price.
 * - Does not execute when no item is selected.
 *
 * Out of scope:
 * - React Query internals (we only assert observable hook outputs).
 * - Transport implementation of the analytics API.
 */

// Shared deterministic mocks (i18n + toast) for this folder.
import './testSetup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import type { ItemOption } from '../../../../../api/analytics/types';
import { useItemPriceQuery } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useItemPriceQuery';

// Deterministic API mock; each test controls resolved/rejected values.
vi.mock('../../../../../api/analytics/priceTrend', () => ({
  getPriceTrend: vi.fn(),
}));

import { getPriceTrend } from '../../../../../api/analytics/priceTrend';

const getPriceTrendMock = vi.mocked(getPriceTrend);

// React Query wrapper with retry disabled for deterministic unit tests.
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
