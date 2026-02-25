/**
 * @file validation.stockMovementParamsSchema.test.ts
 * @module tests/unit/api/analytics/validation.stockMovementParamsSchema
 * @what_is_under_test stockMovementParamsSchema (api/analytics/validation)
 * @responsibility
 * - Guarantees date range fields (start/end) are required and must be ISO dates
 * - Guarantees start <= end constraint is enforced
 * - Guarantees optional supplierId is accepted
 * @out_of_scope
 * - Backend stock movement computations and aggregation semantics
 */

import { describe, it, expect } from 'vitest';
import { stockMovementParamsSchema } from '@/api/analytics/validation';

describe('api/analytics/validation.stockMovementParamsSchema', () => {
  it('accepts start and end dates', () => {
    // Arrange
    const data = { start: '2023-01-01', end: '2023-12-31' };

    // Act
    const result = stockMovementParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('accepts supplierId when provided', () => {
    // Arrange
    const data = { start: '2023-01-01', end: '2023-12-31', supplierId: 'S789' };

    // Act
    const result = stockMovementParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S789');
    }
  });

  it('rejects when start is after end', () => {
    // Arrange
    const data = { start: '2023-12-31', end: '2023-01-01' };

    // Act
    const result = stockMovementParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const startIssue = result.error.issues.find((issue) => issue.path[0] === 'start');
      expect(startIssue).toBeTruthy();
      expect(startIssue?.message).toContain('before or equal');
    }
  });

  it('rejects missing dates', () => {
    // Arrange
    const data = {};

    // Act
    const result = stockMovementParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'start')).toBe(true);
      expect(result.error.issues.some((issue) => issue.path[0] === 'end')).toBe(true);
    }
  });
});
