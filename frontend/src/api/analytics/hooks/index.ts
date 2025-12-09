/**
 * @file index.ts
 * @module api/analytics/hooks
 *
 * @summary
 * Barrel export file for analytics hooks.
 * Provides unified interface for all analytics-related React Query hooks.
 * Organized by concern: dashboard metrics, stock analytics, pricing/financials, and alerts.
 *
 * @enterprise
 * - Single import location for all analytics hooks
 * - Backward compatible with existing imports
 * - Clear separation of concerns across hook modules
 * - Full TypeDoc documentation inheritance
 *
 * @usage
 * ```typescript
 * // Import specific hooks
 * import { useDashboardMetrics, useStockValueQuery } from '@/api/analytics/hooks';
 *
 * // Or import all
 * import * as analyticsHooks from '@/api/analytics/hooks';
 * ```
 */

// Dashboard KPI metrics
export { useDashboardMetrics } from './useDashboardMetrics';

// Stock-focused analytics (trends, movements, distribution)
export {
  useStockValueQuery,
  useMonthlyMovementQuery,
  useStockPerSupplierQuery,
} from './useStockAnalytics';

// Price trends and financial metrics
export {
  usePriceTrendQuery,
  useFinancialSummaryQuery,
} from './usePriceAndFinancials';

// Low-stock alerts and monitoring
export {
  useItemFrequencyQuery,
  useLowStockQuery,
} from './useLowStockAlerts';
