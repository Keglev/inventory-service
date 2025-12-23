/**
 * @file useStockAnalytics.test.ts
 * @module __tests__/unit/api/analytics/hooks/useStockAnalytics
 *
 * @summary
 * Test suite for useStockAnalytics hook.
 * Tests stock analysis and inventory metrics calculation.
 *
 * @what_is_under_test useStockAnalytics hook - analyzes inventory levels and stock performance
 * @responsibility Calculate stock turnover, movement rate, reorder points, and inventory health
 * @out_of_scope Demand forecasting, supplier APIs, warehouse locations
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { AnalyticsParams, StockMovementParams } from '../../../../../api/analytics/validation';

vi.mock('../../../../../api/analytics', () => ({
  getStockValueOverTime: vi.fn(),
  getMonthlyStockMovement: vi.fn(),
  getStockPerSupplier: vi.fn(),
}));

import {
  getStockValueOverTime,
  getMonthlyStockMovement,
  getStockPerSupplier,
} from '../../../../../api/analytics';

import {
  useStockValueQuery,
  useMonthlyMovementQuery,
  useStockPerSupplierQuery,
} from '../../../../../api/analytics/hooks/useStockAnalytics';

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

describe('useStockAnalytics hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useStockValueQuery calls getStockValueOverTime with AnalyticsParams', async () => {
    // Return type depends on your API; we only care that the hook resolves.
    vi.mocked(getStockValueOverTime).mockResolvedValue([] as never);

    const wrapper = createWrapper();

    const params: AnalyticsParams = {
      from: '2025-10-01',
      to: '2025-10-31',
      supplierId: 'SUP-001',
    };

    const { result } = renderHook(() => useStockValueQuery(params, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStockValueOverTime).toHaveBeenCalledTimes(1);
    expect(getStockValueOverTime).toHaveBeenCalledWith(params);
  });

  it('useMonthlyMovementQuery calls getMonthlyStockMovement with StockMovementParams', async () => {
    vi.mocked(getMonthlyStockMovement).mockResolvedValue([] as never);

    const wrapper = createWrapper();

    const params: StockMovementParams = {
      start: '2025-10-01',
      end: '2025-10-31',
      supplierId: 'SUP-001',
    };

    const { result } = renderHook(() => useMonthlyMovementQuery(params, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMonthlyStockMovement).toHaveBeenCalledTimes(1);
    expect(getMonthlyStockMovement).toHaveBeenCalledWith(params);
  });

  it('useStockPerSupplierQuery calls getStockPerSupplier', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([] as never);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useStockPerSupplierQuery(true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStockPerSupplier).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when enabled=false', async () => {
    const wrapper = createWrapper();

    const valueParams: AnalyticsParams = { from: '2025-10-01', to: '2025-10-31' };
    const moveParams: StockMovementParams = { start: '2025-10-01', end: '2025-10-31' };

    renderHook(() => useStockValueQuery(valueParams, false), { wrapper });
    renderHook(() => useMonthlyMovementQuery(moveParams, false), { wrapper });
    renderHook(() => useStockPerSupplierQuery(false), { wrapper });

    await Promise.resolve();

    expect(getStockValueOverTime).not.toHaveBeenCalled();
    expect(getMonthlyStockMovement).not.toHaveBeenCalled();
    expect(getStockPerSupplier).not.toHaveBeenCalled();
  });
});
