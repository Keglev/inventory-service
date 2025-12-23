/**
 * @file usePriceAndFinancials.test.ts
 * @module __tests__/unit/api/analytics/hooks/usePriceAndFinancials
 *
 * @summary
 * Test suite for usePriceAndFinancials hook.
 * Tests price tracking and financial metrics calculation.
 *
 * @what_is_under_test usePriceAndFinancials hook - tracks pricing and financial data
 * @responsibility Fetch and calculate price trends, margins, and revenue metrics
 * @out_of_scope Market price APIs, currency conversions, financial report generation
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { PriceTrendParams, FinancialSummaryParams } from '../../../../../api/analytics/validation';

vi.mock('../../../../../api/analytics', () => ({
  getPriceTrend: vi.fn(),
  getFinancialSummary: vi.fn(),
}));

import { getPriceTrend, getFinancialSummary } from '../../../../../api/analytics';

import {
  usePriceTrendQuery,
  useFinancialSummaryQuery,
} from '../../../../../api/analytics/hooks/usePriceAndFinancials';

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

describe('usePriceAndFinancials hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usePriceTrendQuery calls getPriceTrend with itemId + params', async () => {
    vi.mocked(getPriceTrend).mockResolvedValue([] as never);

    const wrapper = createWrapper();

    const params: PriceTrendParams = {
      itemId: 'ITEM-123',
      start: '2025-10-01',
      end: '2025-10-31',
      supplierId: 'SUP-001',
    };

    const { result } = renderHook(() => usePriceTrendQuery(params, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getPriceTrend).toHaveBeenCalledTimes(1);
    expect(getPriceTrend).toHaveBeenCalledWith('ITEM-123', params);
  });

  it('useFinancialSummaryQuery calls getFinancialSummary with params', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue({} as never);

    const wrapper = createWrapper();

    const params: FinancialSummaryParams = {
      from: '2025-10-01',
      to: '2025-10-31',
      supplierId: 'SUP-001',
    };

    const { result } = renderHook(() => useFinancialSummaryQuery(params, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getFinancialSummary).toHaveBeenCalledTimes(1);
    expect(getFinancialSummary).toHaveBeenCalledWith(params);
  });

  it('does not fetch when enabled=false', async () => {
    const wrapper = createWrapper();

    const priceParams: PriceTrendParams = {
      itemId: 'ITEM-123',
      start: '2025-10-01',
      end: '2025-10-31',
    };

    const finParams: FinancialSummaryParams = {
      from: '2025-10-01',
      to: '2025-10-31',
    };

    renderHook(() => usePriceTrendQuery(priceParams, false), { wrapper });
    renderHook(() => useFinancialSummaryQuery(finParams, false), { wrapper });

    await Promise.resolve();

    expect(getPriceTrend).not.toHaveBeenCalled();
    expect(getFinancialSummary).not.toHaveBeenCalled();
  });
});
