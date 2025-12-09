/**
 * @file useStockAnalytics.ts
 * @module api/analytics/hooks
 *
 * @summary
 * Stock-focused analytics hooks for inventory trend analysis.
 * Provides hooks for stock value trends, monthly movements, and supplier distribution.
 *
 * @enterprise
 * - Consistent 5-minute cache strategy for trend data
 * - Parameter validation before API calls
 * - Full TypeDoc documentation for analytics queries
 * - Composable hooks for dashboard and report views
 */

import { useQuery } from '@tanstack/react-query';
import {
  getStockValueOverTime,
  getMonthlyStockMovement,
  getStockPerSupplier,
} from '../index';
import type { AnalyticsParams, StockMovementParams } from '../validation';

/**
 * Hook to load stock value over time (trend chart data).
 * Caches results for 5 minutes.
 *
 * @param params - Date range and optional supplier filter
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with stock value points
 *
 * @example
 * ```typescript
 * const { data: points, isLoading } = useStockValueQuery({
 *   from: '2025-09-01',
 *   to: '2025-11-30',
 *   supplierId: 'SUP-001'
 * });
 *
 * return <LineChart data={points} loading={isLoading} />;
 * ```
 */
export function useStockValueQuery(params: AnalyticsParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'stock-value', params],
    queryFn: () => getStockValueOverTime(params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load monthly stock movement (inbound/outbound).
 * Useful for trend analysis and planning.
 *
 * @param params - Date range and optional supplier filter
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with monthly movement data
 *
 * @example
 * ```typescript
 * const { data: movements } = useMonthlyMovementQuery({
 *   from: '2025-09-01',
 *   to: '2025-11-30'
 * });
 *
 * return <BarChart data={movements} />;
 * ```
 */
export function useMonthlyMovementQuery(params: StockMovementParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'monthly-movement', params],
    queryFn: () => getMonthlyStockMovement(params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load current stock distribution per supplier.
 * Useful for supplier-level analytics and reporting.
 *
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with per-supplier stock totals
 *
 * @example
 * ```typescript
 * const { data: distribution } = useStockPerSupplierQuery();
 *
 * return <DoughnutChart data={distribution} />;
 * ```
 */
export function useStockPerSupplierQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'stock-per-supplier'],
    queryFn: () => getStockPerSupplier(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
