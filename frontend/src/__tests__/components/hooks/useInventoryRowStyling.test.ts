/**
 * @file useInventoryRowStyling.test.ts
 * @module __tests__/components/hooks/useInventoryRowStyling
 * @description
 * Enterprise unit tests for `useInventoryRowStyling`.
 *
 * The hook returns a pure function that maps (onHand, minQty) to a CSS class:
 * - ""            → stock is sufficient or result cannot be determined
 * - "row-warning" → small deficit (1–4)
 * - "row-critical"→ large deficit (>= 5)
 *
 * We explicitly cover:
 * - boundary conditions (0/1 and 4/5 deficits)
 * - normalization of invalid minQty (<= 0 or NaN → defaults to 5)
 * - negative stock values
 * - current NaN-onHand behavior (documents implementation reality)
 */

import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInventoryRowStyling } from '@/pages/inventory/hooks/useInventoryRowStyling';

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

function setup() {
  const { result } = renderHook(() => useInventoryRowStyling());
  return result.current;
}

type Case = {
  onHand: number;
  minQty: number;
  expected: string;
};

describe('useInventoryRowStyling', () => {
  it('returns a function', () => {
    const getRowClass = setup();
    expect(typeof getRowClass).toBe('function');
  });

  it('returns empty string when stock is sufficient', () => {
    const getRowClass = setup();

    const cases: Case[] = [
      { onHand: 10, minQty: 5, expected: '' },  // surplus
      { onHand: 5, minQty: 5, expected: '' },   // exact
      { onHand: 100, minQty: 50, expected: '' } // large surplus
    ];

    for (const c of cases) {
      expect(getRowClass(c.onHand, c.minQty)).toBe(c.expected);
    }
  });

  it('returns row-warning for a deficit of 1–4', () => {
    const getRowClass = setup();

    const cases: Case[] = [
      { onHand: 4, minQty: 5, expected: 'row-warning' }, // deficit 1
      { onHand: 3, minQty: 5, expected: 'row-warning' }, // deficit 2
      { onHand: 2, minQty: 5, expected: 'row-warning' }, // deficit 3
      { onHand: 1, minQty: 5, expected: 'row-warning' }, // deficit 4
      { onHand: 0, minQty: 3, expected: 'row-warning' }, // deficit 3 (explicit edge coverage)
    ];

    for (const c of cases) {
      expect(getRowClass(c.onHand, c.minQty)).toBe(c.expected);
    }
  });

  it('returns row-critical for a deficit of 5 or more', () => {
    const getRowClass = setup();

    const cases: Case[] = [
      { onHand: 0, minQty: 5, expected: 'row-critical' },   // deficit 5
      { onHand: 0, minQty: 10, expected: 'row-critical' },  // deficit 10
      { onHand: 5, minQty: 15, expected: 'row-critical' },  // deficit 10
      { onHand: -2, minQty: 5, expected: 'row-critical' },  // deficit 7 (negative stock)
      { onHand: -5, minQty: 10, expected: 'row-critical' }, // deficit 15 (negative stock)
    ];

    for (const c of cases) {
      expect(getRowClass(c.onHand, c.minQty)).toBe(c.expected);
    }
  });

  it('defaults minQty to 5 when minQty is <= 0 or NaN', () => {
    const getRowClass = setup();

    // This is a data-contract behavior: invalid thresholds fall back to a safe default.
    const cases: Case[] = [
      // minQty = 0 → treated as 5
      { onHand: 6, minQty: 0, expected: '' },
      { onHand: 4, minQty: 0, expected: 'row-warning' },   // deficit 1 from default 5
      { onHand: 0, minQty: 0, expected: 'row-critical' },  // deficit 5 from default 5

      // minQty negative → treated as 5
      { onHand: 4, minQty: -10, expected: 'row-warning' },
      { onHand: 0, minQty: -5, expected: 'row-critical' },

      // minQty NaN → treated as 5
      { onHand: 4, minQty: Number.NaN, expected: 'row-warning' },
      { onHand: 0, minQty: Number.NaN, expected: 'row-critical' },
    ];

    for (const c of cases) {
      expect(getRowClass(c.onHand, c.minQty)).toBe(c.expected);
    }
  });

  it('documents current behavior when onHand is NaN', () => {
    const getRowClass = setup();

    /**
     * Important: This test documents the *current* implementation behavior.
     * If the hook later normalizes NaN → 0, this expectation should change.
     *
     * In the current logic, NaN propagates into the deficit calculation and
     * comparison checks fail, so no class is applied.
     */
    expect(getRowClass(Number.NaN, 5)).toBe('');
  });

  it('is stable across repeated calls for the same inputs', () => {
    const getRowClass = setup();

    expect(getRowClass(3, 5)).toBe('row-warning');
    expect(getRowClass(3, 5)).toBe('row-warning');
    expect(getRowClass(0, 10)).toBe('row-critical');
    expect(getRowClass(0, 10)).toBe('row-critical');
  });

  it('handles boundary conditions around deficit thresholds', () => {
    const getRowClass = setup();

    // Boundary: normal vs warning (deficit 0 vs 1)
    expect(getRowClass(10, 10)).toBe('');
    expect(getRowClass(9, 10)).toBe('row-warning');

    // Boundary: warning vs critical (deficit 4 vs 5)
    expect(getRowClass(6, 10)).toBe('row-warning');
    expect(getRowClass(5, 10)).toBe('row-critical');
  });
});
