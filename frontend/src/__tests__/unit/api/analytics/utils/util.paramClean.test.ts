/**
 * @file util.paramClean.test.ts
 * @module tests/unit/api/analytics/util.paramClean
 * @what_is_under_test paramClean (api/analytics/util)
 * @responsibility
 * - Guarantees date inputs are mapped into the expected {start,end} parameter shape
 * - Guarantees optional supplierId is preserved when provided
 * - Guarantees reasonable default dates exist when no range is provided
 * @out_of_scope
 * - Exact default range length (e.g., “180 days”) and timezone semantics
 * - Input validation for malformed date strings
 */

import { describe, it, expect } from 'vitest';
import { paramClean } from '@/api/analytics/util';

describe('paramClean', () => {
  it('maps provided from/to into start/end', () => {
    const params = { from: '2023-01-01', to: '2023-12-31' };

    const result = paramClean(params);

    expect(result.start).toBe('2023-01-01');
    expect(result.end).toBe('2023-12-31');
  });

  it('includes supplierId when provided', () => {
    const params = { supplierId: 'S123' };

    const result = paramClean(params);

    expect(result.supplierId).toBe('S123');
  });

  it('provides default dates when no range is provided', () => {
    const result = paramClean();

    expect(result.start).toBeTruthy();
    expect(result.end).toBeTruthy();
    expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
