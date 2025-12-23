/**
 * @file useLowStockAlerts.test.ts
 * @module __tests__/unit/api/analytics/hooks/useLowStockAlerts
 *
 * @summary
 * Test suite for useLowStockAlerts hook.
 * Tests low stock detection and alert generation.
 *
 * @what_is_under_test useLowStockAlerts hook - detects and alerts on low stock items
 * @responsibility Monitor inventory levels and trigger alerts for items below threshold
 * @out_of_scope Notification delivery, user preferences, alert persistence
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

//  Mock the API functions the hooks call (they import from ../index => api/analytics/index.ts)
vi.mock('../../../../../api/analytics', () => ({
  getItemUpdateFrequency: vi.fn(),
  getLowStockItems: vi.fn(),
}));

import {
  getItemUpdateFrequency,
  getLowStockItems,
} from '../../../../../api/analytics';

import {
  useItemFrequencyQuery,
  useLowStockQuery,
} from '../../../../../api/analytics/hooks/useLowStockAlerts';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useLowStockAlerts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useItemFrequencyQuery', () => {
    it('fetches frequency when supplierId is provided and enabled=true', async () => {
      vi.mocked(getItemUpdateFrequency).mockResolvedValue([
        { itemId: 'I-1', updates: 3 },
      ] as unknown as never);

      const wrapper = createWrapper();

      const { result } = renderHook(
        () => useItemFrequencyQuery('SUP-001', true),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(getItemUpdateFrequency).toHaveBeenCalledTimes(1);
      expect(getItemUpdateFrequency).toHaveBeenCalledWith('SUP-001');
    });

    it('does not fetch when supplierId is empty', async () => {
      const wrapper = createWrapper();

      renderHook(() => useItemFrequencyQuery('', true), { wrapper });

      await Promise.resolve();

      expect(getItemUpdateFrequency).not.toHaveBeenCalled();
    });

    it('does not fetch when enabled=false', async () => {
      const wrapper = createWrapper();

      renderHook(() => useItemFrequencyQuery('SUP-001', false), { wrapper });

      await Promise.resolve();

      expect(getItemUpdateFrequency).not.toHaveBeenCalled();
    });
  });

  describe('useLowStockQuery', () => {
    it('fetches low stock items when supplierId is provided and enabled=true', async () => {
      vi.mocked(getLowStockItems).mockResolvedValue([
        { id: 'ITEM-1', name: 'Item A', onHand: 2, minQty: 5 },
      ] as unknown as never);

      const wrapper = createWrapper();

      const { result } = renderHook(() => useLowStockQuery('SUP-001', true), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(getLowStockItems).toHaveBeenCalledTimes(1);
      expect(getLowStockItems).toHaveBeenCalledWith('SUP-001');
    });

    it('does not fetch when supplierId is empty', async () => {
      const wrapper = createWrapper();

      renderHook(() => useLowStockQuery('', true), { wrapper });

      await Promise.resolve();

      expect(getLowStockItems).not.toHaveBeenCalled();
    });

    it('does not fetch when enabled=false', async () => {
      const wrapper = createWrapper();

      renderHook(() => useLowStockQuery('SUP-001', false), { wrapper });

      await Promise.resolve();

      expect(getLowStockItems).not.toHaveBeenCalled();
    });
  });
});
