/**
 * @file validation.analyticsParamsSchema.test.ts
 * @module tests/unit/api/analytics/validation.analyticsParamsSchema
 * @what_is_under_test analyticsParamsSchema (api/analytics/validation)
 * @responsibility
 * - Guarantees optional analytics query params accept valid ISO dates and supplierId
 * - Guarantees invalid date formats fail validation without throwing
 * @out_of_scope
 * - Backend interpretation of the parameters and any business semantics
 * - Cross-field constraints (this schema does not enforce from <= to)
 */

import { describe, it, expect } from 'vitest';
import { analyticsParamsSchema } from '@/api/analytics/validation';

describe('api/analytics/validation.analyticsParamsSchema', () => {
  it('accepts from/to ISO dates', () => {
    // Arrange
    const data = { from: '2023-01-01', to: '2023-12-31' };

    // Act
    const result = analyticsParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('accepts supplierId when provided', () => {
    // Arrange
    const data = { from: '2023-01-01', to: '2023-12-31', supplierId: 'S123' };

    // Act
    const result = analyticsParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S123');
    }
  });

  it('accepts an empty object (all fields optional)', () => {
    // Arrange
    const data = {};

    // Act
    const result = analyticsParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it('rejects invalid date formats', () => {
    // Arrange
    const data = { from: 'not-a-date', to: '2023-12-31' };

    // Act
    const result = analyticsParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'from')).toBe(true);
    }
  });
});
