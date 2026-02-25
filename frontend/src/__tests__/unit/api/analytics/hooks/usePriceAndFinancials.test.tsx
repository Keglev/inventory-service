/**
 * @file usePriceAndFinancials.test.tsx
 * @module __tests__/unit/api/analytics/hooks/usePriceAndFinancials
 * @what_is_under_test usePriceTrendQuery and useFinancialSummaryQuery hooks
 * @responsibility
 * - Delegates to the analytics API with the expected params contract
 * - Gates data fetching behind an explicit enabled flag
 * - Exposes React Query success state when dependencies resolve
 * @out_of_scope
 * - Financial correctness (margins/revenue math) and backend aggregation semantics
 * - Currency conversion, rounding rules, and date parsing/validation behavior
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { createReactQueryWrapper } from '../../../utils/reactQueryTestUtils';

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

describe('usePriceAndFinancials hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usePriceTrendQuery calls getPriceTrend with itemId + params', async () => {
    // Arrange
    vi.mocked(getPriceTrend).mockResolvedValue([] as never);

    const wrapper = createReactQueryWrapper({ retry: false });

    const params: PriceTrendParams = {
      itemId: 'ITEM-123',
      start: '2025-10-01',
      end: '2025-10-31',
      supplierId: 'SUP-001',
    };

    // Act
    const { result } = renderHook(() => usePriceTrendQuery(params, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(getPriceTrend).toHaveBeenCalledTimes(1);
    expect(getPriceTrend).toHaveBeenCalledWith('ITEM-123', params);
  });

  it('useFinancialSummaryQuery calls getFinancialSummary with params', async () => {
    // Arrange
    vi.mocked(getFinancialSummary).mockResolvedValue({} as never);

    const wrapper = createReactQueryWrapper({ retry: false });

    const params: FinancialSummaryParams = {
      from: '2025-10-01',
      to: '2025-10-31',
      supplierId: 'SUP-001',
    };

    // Act
    const { result } = renderHook(() => useFinancialSummaryQuery(params, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(getFinancialSummary).toHaveBeenCalledTimes(1);
    expect(getFinancialSummary).toHaveBeenCalledWith(params);
  });

  it('does not fetch when enabled=false', async () => {
    // Arrange
    const wrapper = createReactQueryWrapper({ retry: false });

    const priceParams: PriceTrendParams = {
      itemId: 'ITEM-123',
      start: '2025-10-01',
      end: '2025-10-31',
    };

    const finParams: FinancialSummaryParams = {
      from: '2025-10-01',
      to: '2025-10-31',
    };

    // Act
    renderHook(() => usePriceTrendQuery(priceParams, false), { wrapper });
    renderHook(() => useFinancialSummaryQuery(finParams, false), { wrapper });

    await Promise.resolve();

    // Assert
    expect(getPriceTrend).not.toHaveBeenCalled();
    expect(getFinancialSummary).not.toHaveBeenCalled();
  });
});
