/**
 * @module api/analytics/validation
 *
 * Zod schema for the analytics filter parameters (date window and supplier)
 * shared across analytics API modules, and the type inferred from it.
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
