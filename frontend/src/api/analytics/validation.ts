/**
 * @file validation.ts
 * @module api/analytics/validation
 *
 * @summary
 * Centralized validation schemas for analytics query parameters.
 * Zod schemas for common analytics filters and date ranges.
 *
 * @enterprise
 * - All analytics queries validate parameters before API calls
 * - Consistent date format handling (ISO 8601)
 * - Optional supplier filtering with validation
 * - Type-safe parameter validation
 */

import { z } from 'zod';

/**
 * Base parameters for analytics queries with optional date range and supplier filter.
 * Used by most analytics endpoints for consistent parameter handling.
 */
export const analyticsParamsSchema = z.object({
  from: z.string().date().optional(),           // ISO date YYYY-MM-DD
  to: z.string().date().optional(),             // ISO date YYYY-MM-DD
  supplierId: z.string().optional(),             // Optional supplier filter
});

export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>;

/**
 * Parameters specifically for price trend queries.
 * Requires itemId, dates are required for meaningful trends.
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

export type PriceTrendParams = z.infer<typeof priceTrendParamsSchema>;

/**
 * Parameters for stock movement queries.
 * Requires date range for meaningful movement analysis.
 */
export const stockMovementParamsSchema = z.object({
  start: z.string().date('Start must be a valid date (YYYY-MM-DD)'),
  end: z.string().date('End must be a valid date (YYYY-MM-DD)'),
  supplierId: z.string().optional(),
}).refine(
  (data) => data.start <= data.end,
  { message: 'Start date must be before or equal to end date', path: ['start'] }
);

export type StockMovementParams = z.infer<typeof stockMovementParamsSchema>;

/**
 * Parameters for financial summary queries.
 * Requires date range for WAC calculations.
 */
export const financialSummaryParamsSchema = z.object({
  from: z.string().date('From date must be a valid date (YYYY-MM-DD)'),
  to: z.string().date('To date must be a valid date (YYYY-MM-DD)'),
  supplierId: z.string().optional(),
}).refine(
  (data) => data.from <= data.to,
  { message: 'From date must be before or equal to to date', path: ['from'] }
);

export type FinancialSummaryParams = z.infer<typeof financialSummaryParamsSchema>;
