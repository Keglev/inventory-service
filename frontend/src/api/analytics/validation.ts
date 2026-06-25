/**
 * @module api/analytics/validation
 *
 * Zod schemas shared across analytics API modules to enforce consistent
 * parameter shapes before requests are dispatched. Each schema corresponds
 * to a distinct query context (general, price-trend, stock-movement, financial)
 * so callers can validate early and surface type-safe errors to the UI.
 */

import { z } from 'zod';

/**
 * Shared baseline for analytics endpoints that allow but do not require a date
 * window or supplier scope — omitting fields returns unscoped results.
 */
export const analyticsParamsSchema = z.object({
  from: z.string().date().optional(),           // ISO date YYYY-MM-DD
  to: z.string().date().optional(),             // ISO date YYYY-MM-DD
  supplierId: z.string().optional(),             // Optional supplier filter
});

/** Inferred once here so callers avoid repeating `z.infer<typeof analyticsParamsSchema>` at every use site. */
export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>;

/**
 * Validates price-trend query inputs — `itemId` and a bounded date window are
 * required because a trend without a target item or time range is undefined.
 */
export const priceTrendParamsSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  start: z.string().date('Start must be a valid date (YYYY-MM-DD)'),
  end: z.string().date('End must be a valid date (YYYY-MM-DD)'),
  supplierId: z.string().optional(),
}).refine(
  (data) => data.start <= data.end,
  { message: 'Start date must be before or equal to end date', path: ['start'] }
);

/** Inferred once here so callers avoid repeating `z.infer<typeof priceTrendParamsSchema>` at every use site. */
export type PriceTrendParams = z.infer<typeof priceTrendParamsSchema>;

/**
 * Validates stock-movement query inputs — a date window is required because
 * movement is only meaningful relative to a bounded period.
 */
export const stockMovementParamsSchema = z.object({
  start: z.string().date('Start must be a valid date (YYYY-MM-DD)'),
  end: z.string().date('End must be a valid date (YYYY-MM-DD)'),
  supplierId: z.string().optional(),
}).refine(
  (data) => data.start <= data.end,
  { message: 'Start date must be before or equal to end date', path: ['start'] }
);

/** Inferred once here so callers avoid repeating `z.infer<typeof stockMovementParamsSchema>` at every use site. */
export type StockMovementParams = z.infer<typeof stockMovementParamsSchema>;

/**
 * Validates financial-summary inputs — `from`/`to` are required because WAC
 * (Weighted Average Cost) calculations are undefined without a bounded period.
 */
export const financialSummaryParamsSchema = z.object({
  from: z.string().date('From date must be a valid date (YYYY-MM-DD)'),
  to: z.string().date('To date must be a valid date (YYYY-MM-DD)'),
  supplierId: z.string().optional(),
}).refine(
  (data) => data.from <= data.to,
  { message: 'From date must be before or equal to to date', path: ['from'] }
);

/** Inferred once here so callers avoid repeating `z.infer<typeof financialSummaryParamsSchema>` at every use site. */
export type FinancialSummaryParams = z.infer<typeof financialSummaryParamsSchema>;
