/**
 * @file validation.financialSummaryParamsSchema.test.ts
 * @module tests/unit/api/analytics/validation.financialSummaryParamsSchema
 * @what_is_under_test financialSummaryParamsSchema (api/analytics/validation)
 * @responsibility
 * - Guarantees date range fields (from/to) are required and must be ISO dates
 * - Guarantees from <= to constraint is enforced
 * - Guarantees optional supplierId is accepted
 * @out_of_scope
 * - Backend financial calculations (WAC/COGS/purchases) and any accounting semantics
 */

import { describe, it, expect } from 'vitest';
import { financialSummaryParamsSchema } from '@/api/analytics/validation';

describe('api/analytics/validation.financialSummaryParamsSchema', () => {
  it('accepts from and to dates', () => {
    // Arrange
    const data = { from: '2023-01-01', to: '2023-12-31' };

    // Act
    const result = financialSummaryParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('accepts supplierId when provided', () => {
    // Arrange
    const data = { from: '2023-01-01', to: '2023-12-31', supplierId: 'S999' };

    // Act
    const result = financialSummaryParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S999');
    }
  });

  it('rejects when from is after to', () => {
    // Arrange
    const data = { from: '2023-12-31', to: '2023-01-01' };

    // Act
    const result = financialSummaryParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const fromIssue = result.error.issues.find((issue) => issue.path[0] === 'from');
      expect(fromIssue).toBeTruthy();
      expect(fromIssue?.message).toContain('before or equal');
    }
  });

  it('accepts when from equals to', () => {
    // Arrange
    const data = { from: '2023-06-15', to: '2023-06-15' };

    // Act
    const result = financialSummaryParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
  });

  it('rejects missing dates', () => {
    // Arrange
    const data = {};

    // Act
    const result = financialSummaryParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'from')).toBe(true);
      expect(result.error.issues.some((issue) => issue.path[0] === 'to')).toBe(true);
    }
  });
});
