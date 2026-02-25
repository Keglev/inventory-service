/**
 * @file validation.priceTrendParamsSchema.test.ts
 * @module tests/unit/api/analytics/validation.priceTrendParamsSchema
 * @what_is_under_test priceTrendParamsSchema (api/analytics/validation)
 * @responsibility
 * - Guarantees required fields (itemId/start/end) are enforced
 * - Guarantees date fields must be valid ISO dates and start <= end
 * - Guarantees optional supplierId is accepted
 * @out_of_scope
 * - Backend price trend calculations and any domain-specific time bucketing
 */

import { describe, it, expect } from 'vitest';
import { priceTrendParamsSchema } from '@/api/analytics/validation';

describe('api/analytics/validation.priceTrendParamsSchema', () => {
  it('accepts all required fields', () => {
    // Arrange
    const data = { itemId: 'ITEM123', start: '2023-01-01', end: '2023-12-31' };

    // Act
    const result = priceTrendParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('accepts supplierId when provided', () => {
    // Arrange
    const data = {
      itemId: 'ITEM123',
      start: '2023-01-01',
      end: '2023-12-31',
      supplierId: 'S456',
    };

    // Act
    const result = priceTrendParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S456');
    }
  });

  it('rejects missing itemId', () => {
    // Arrange
    const data = { start: '2023-01-01', end: '2023-12-31' };

    // Act
    const result = priceTrendParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'itemId')).toBe(true);
    }
  });

  it('rejects empty itemId', () => {
    // Arrange
    const data = { itemId: '', start: '2023-01-01', end: '2023-12-31' };

    // Act
    const result = priceTrendParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'itemId')).toBe(true);
      expect(result.error.issues.some((issue) => issue.message === 'Item ID is required')).toBe(true);
    }
  });

  it('rejects when start is after end', () => {
    // Arrange
    const data = { itemId: 'ITEM123', start: '2023-12-31', end: '2023-01-01' };

    // Act
    const result = priceTrendParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const startIssue = result.error.issues.find((issue) => issue.path[0] === 'start');
      expect(startIssue).toBeTruthy();
      expect(startIssue?.message).toContain('before or equal');
    }
  });

  it('accepts when start equals end', () => {
    // Arrange
    const data = { itemId: 'ITEM123', start: '2023-06-15', end: '2023-06-15' };

    // Act
    const result = priceTrendParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
  });

  it('rejects invalid date formats', () => {
    // Arrange
    const data = { itemId: 'ITEM123', start: 'invalid-date', end: '2023-12-31' };

    // Act
    const result = priceTrendParamsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'start')).toBe(true);
      expect(result.error.issues.some((issue) => issue.message.includes('valid date'))).toBe(true);
    }
  });
});
