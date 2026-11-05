/**
 * @file validation.analyticsParamsSchema.test.ts
 * @module __tests__/api/analytics/validation.analyticsParamsSchema
 * @description Contract tests for analyticsParamsSchema (api/analytics/validation).
 *
 * Contract under test:
 * - Guarantees optional analytics query params accept valid ISO dates
 *   and supplierId
 * - Guarantees invalid date formats fail validation without throwing
 *
 * Out of scope:
 * - Backend interpretation of the parameters and any business semantics
 * - Cross-field constraints (this schema does not enforce from <= to)
 */

import { describe, it, expect } from 'vitest';
import { analyticsParamsSchema } from '@/api/analytics/validation';

describe('api/analytics/validation.analyticsParamsSchema', () => {
  it('accepts from/to ISO dates', () => {
    const data = { from: '2023-01-01', to: '2023-12-31' };

    const result = analyticsParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('accepts supplierId when provided', () => {
    const data = { from: '2023-01-01', to: '2023-12-31', supplierId: 'S123' };

    const result = analyticsParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S123');
    }
  });

  it('accepts an empty object (all fields optional)', () => {
    const data = {};

    const result = analyticsParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it('rejects invalid date formats', () => {
    const data = { from: 'not-a-date', to: '2023-12-31' };

    const result = analyticsParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'from')).toBe(true);
    }
  });
});
