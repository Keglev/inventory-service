/**
 * @file validation.test.ts
 * @module api/analytics/validation.test
 * 
 * Unit tests for analytics validation schemas.
 * Tests analyticsParamsSchema, priceTrendParamsSchema, stockMovementParamsSchema,
 * and financialSummaryParamsSchema with valid/invalid data.
 */

import { describe, it, expect } from 'vitest';
import {
  analyticsParamsSchema,
  priceTrendParamsSchema,
  stockMovementParamsSchema,
  financialSummaryParamsSchema,
} from '@/api/analytics/validation';

describe('analyticsParamsSchema', () => {
  it('should validate with from and to dates', () => {
    const data = { from: '2023-01-01', to: '2023-12-31' };
    const result = analyticsParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should validate with supplierId', () => {
    const data = { from: '2023-01-01', to: '2023-12-31', supplierId: 'S123' };
    const result = analyticsParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S123');
    }
  });

  it('should validate with empty object (all optional)', () => {
    const result = analyticsParamsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject invalid date format', () => {
    const data = { from: 'not-a-date', to: '2023-12-31' };
    const result = analyticsParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('priceTrendParamsSchema', () => {
  it('should validate with all required fields', () => {
    const data = {
      itemId: 'ITEM123',
      start: '2023-01-01',
      end: '2023-12-31',
    };
    const result = priceTrendParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should validate with optional supplierId', () => {
    const data = {
      itemId: 'ITEM123',
      start: '2023-01-01',
      end: '2023-12-31',
      supplierId: 'S456',
    };
    const result = priceTrendParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S456');
    }
  });

  it('should reject missing itemId', () => {
    const data = { start: '2023-01-01', end: '2023-12-31' };
    const result = priceTrendParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject empty itemId', () => {
    const data = { itemId: '', start: '2023-01-01', end: '2023-12-31' };
    const result = priceTrendParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Item ID is required');
    }
  });

  it('should reject when start is after end', () => {
    const data = {
      itemId: 'ITEM123',
      start: '2023-12-31',
      end: '2023-01-01',
    };
    const result = priceTrendParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Start date must be before');
    }
  });

  it('should accept when start equals end', () => {
    const data = {
      itemId: 'ITEM123',
      start: '2023-06-15',
      end: '2023-06-15',
    };
    const result = priceTrendParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should reject invalid date format', () => {
    const data = {
      itemId: 'ITEM123',
      start: 'invalid-date',
      end: '2023-12-31',
    };
    const result = priceTrendParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid date');
    }
  });
});

describe('stockMovementParamsSchema', () => {
  it('should validate with start and end dates', () => {
    const data = { start: '2023-01-01', end: '2023-12-31' };
    const result = stockMovementParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should validate with supplierId', () => {
    const data = {
      start: '2023-01-01',
      end: '2023-12-31',
      supplierId: 'S789',
    };
    const result = stockMovementParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S789');
    }
  });

  it('should reject when start is after end', () => {
    const data = { start: '2023-12-31', end: '2023-01-01' };
    const result = stockMovementParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Start date must be before');
    }
  });

  it('should reject missing dates', () => {
    const result = stockMovementParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('financialSummaryParamsSchema', () => {
  it('should validate with from and to dates', () => {
    const data = { from: '2023-01-01', to: '2023-12-31' };
    const result = financialSummaryParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should validate with supplierId', () => {
    const data = {
      from: '2023-01-01',
      to: '2023-12-31',
      supplierId: 'S999',
    };
    const result = financialSummaryParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supplierId).toBe('S999');
    }
  });

  it('should reject when from is after to', () => {
    const data = { from: '2023-12-31', to: '2023-01-01' };
    const result = financialSummaryParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('From date must be before');
    }
  });

  it('should accept when from equals to', () => {
    const data = { from: '2023-06-15', to: '2023-06-15' };
    const result = financialSummaryParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should reject missing dates', () => {
    const result = financialSummaryParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
