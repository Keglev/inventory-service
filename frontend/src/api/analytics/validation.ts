/**
 * @file validation.ts
 * @module api/analytics/validation
 *
 * @summary
 * Zod schema for the analytics filter parameters (date window and supplier) and
 * the type inferred from it.
 *
 * @enterprise
 * Shared across the analytics API modules, so every analytics call validates its
 * filters by one rule.
 */

import { z } from 'zod';

/**
 * Shared baseline for analytics endpoints that allow but do not require a date
 * window or supplier scope — omitting fields returns unscoped results.
 */
export const analyticsParamsSchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  supplierId: z.string().optional(),
});

/** Inferred once here so callers avoid repeating `z.infer<typeof analyticsParamsSchema>` at every use site. */
export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>;
