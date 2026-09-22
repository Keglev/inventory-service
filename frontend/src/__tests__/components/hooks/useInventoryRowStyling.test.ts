/**
 * @file useInventoryRowStyling.test.ts
 * @module __tests__/components/hooks/useInventoryRowStyling
 * @description
 * Contract tests for `useInventoryRowStyling`, and through it for
 * `lowStockSeverity` (config/inventoryPolicy, frontend ADR-0012).
 *
 * Contract under test:
 * - "row-critical" at or below half the item's minimum.
 * - "row-warning" above half the minimum and below it.
 * - "" at or above the minimum, and when the minimum is missing or not
 *   positive, or the quantity is not a number.
 * - The bands scale with the minimum; an odd minimum rounds towards warning.
 */

import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInventoryRowStyling } from '@/pages/inventory/hooks/useInventoryRowStyling';

function setup() {
  const { result } = renderHook(() => useInventoryRowStyling());
  return result.current;
}

describe('useInventoryRowStyling', () => {
  it('colours the default minimum of 10: red to 5, orange 6 to 9, none from 10', () => {
    const getRowClass = setup();
    const expected = [
      'row-critical', 'row-critical', 'row-critical', 'row-critical', 'row-critical', 'row-critical',
      'row-warning', 'row-warning', 'row-warning', 'row-warning',
      '', '', '',
    ];
    expected.forEach((cls, onHand) => {
      expect(getRowClass(onHand, 10)).toBe(cls);
    });
  });

  it('scales the bands with a minimum of 25: red to 12, orange 13 to 24', () => {
    const getRowClass = setup();
    expect(getRowClass(12, 25)).toBe('row-critical');
    expect(getRowClass(13, 25)).toBe('row-warning');
    expect(getRowClass(20, 25)).toBe('row-warning');
    expect(getRowClass(24, 25)).toBe('row-warning');
    expect(getRowClass(25, 25)).toBe('');
  });

  it('scales the bands with a minimum of 6: red to 3, orange 4 and 5', () => {
    const getRowClass = setup();
    expect(getRowClass(3, 6)).toBe('row-critical');
    expect(getRowClass(4, 6)).toBe('row-warning');
    expect(getRowClass(5, 6)).toBe('row-warning');
    expect(getRowClass(6, 6)).toBe('');
  });

  it('shows a stock of 1 as red for every minimum of 2 or more', () => {
    const getRowClass = setup();
    for (const minQty of [2, 5, 10, 25]) {
      expect(getRowClass(1, minQty)).toBe('row-critical');
    }
  });

  it('shows negative stock as red', () => {
    const getRowClass = setup();
    expect(getRowClass(-2, 10)).toBe('row-critical');
  });

  it('applies no class when the minimum is missing or not positive', () => {
    const getRowClass = setup();
    const loose = getRowClass as unknown as (onHand: number, minQty: number | undefined) => string;
    expect(getRowClass(0, 0)).toBe('');
    expect(getRowClass(0, -5)).toBe('');
    expect(getRowClass(0, Number.NaN)).toBe('');
    expect(loose(0, undefined)).toBe('');
  });

  it('applies no class when the quantity is not a number', () => {
    const getRowClass = setup();
    expect(getRowClass(Number.NaN, 10)).toBe('');
  });
});
