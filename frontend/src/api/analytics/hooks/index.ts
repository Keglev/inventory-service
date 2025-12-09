/**
 * @file index.ts
 * @module api/analytics/hooks
 * @public
 *
 * @summary
 * Public export point for analytics data fetching hooks.
 */

export {
  useDashboardMetrics,
  useStockValueQuery,
  useMonthlyMovementQuery,
  useStockPerSupplierQuery,
  usePriceTrendQuery,
  useFinancialSummaryQuery,
  useItemFrequencyQuery,
  useLowStockQuery,
} from './useAnalyticsData';
