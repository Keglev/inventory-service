/**
 * @file usePriceAndFinancials.ts
 * @module api/analytics/hooks
 *
 * @summary
 * Price and financial analytics hooks for cost-based inventory metrics.
 * Provides hooks for price trends and financial summaries with WAC calculations.
 *
 * @enterprise
 * - Consistent 5-minute cache strategy for financial data
 * - Item-specific price trend analysis
 * - WAC (Weighted Average Cost) integrated financial metrics
 * - Full TypeDoc documentation for financial queries
 */

import { useQuery } from '@tanstack/react-query';
import {
  getPriceTrend,
  getFinancialSummary,
} from '../index';
import type { PriceTrendParams, FinancialSummaryParams } from '../validation';

/**
 * Hook to load price trend for a specific item.
 * Shows historical price changes over time.
 *
 * @param params - Item ID, date range, optional supplier filter
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with price points
 *
 * @example
 * ```typescript
 * const { data: prices } = usePriceTrendQuery({
 *   itemId: 'ITEM-123',
 *   start: '2025-09-01',
 *   end: '2025-11-30'
 * });
 *
 * return <LineChart data={prices} />;
 * ```
 */
export function usePriceTrendQuery(params: PriceTrendParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'price-trend', params],
    queryFn: () => getPriceTrend(params.itemId, params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load financial summary with WAC calculations.
 * Shows cost-based inventory metrics.
 *
 * @param params - Date range and optional supplier filter
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with financial summary
 *
 * @example
 * ```typescript
 * const { data: summary } = useFinancialSummaryQuery({
 *   from: '2025-09-01',
 *   to: '2025-11-30'
 * });
 *
 * return <FinancialDashboard data={summary} />;
 * ```
 */
export function useFinancialSummaryQuery(params: FinancialSummaryParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'financial-summary', params],
    queryFn: () => getFinancialSummary(params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
