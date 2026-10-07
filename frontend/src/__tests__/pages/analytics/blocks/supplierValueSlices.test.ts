/**
 * @file supplierValueSlices.test.ts
 * @module __tests__/pages/analytics/blocks/supplierValueSlices
 * @description
 * The grouping rule behind the stock value pie: every supplier up to five, the
 * top four plus "all others" beyond that, no suppliers without value, and name
 * order for equal values. Its sibling, StockValuePerSupplierPie.test.tsx,
 * covers the rendering.
 */

import { describe, expect, it } from 'vitest';

import type { StockPerSupplierPoint } from '@/api/analytics/types';
import { supplierValueSlices } from '@/pages/analytics/blocks/supplierValueSlices';

function point(supplierName: string, totalValue: number): StockPerSupplierPoint {
  return { supplierName, totalQuantity: 1, totalValue };
}

describe('supplierValueSlices', () => {
  it('returns every supplier by name when there are five or fewer', () => {
    const slices = supplierValueSlices([
      point('A', 50), point('B', 40), point('C', 30), point('D', 20), point('E', 10),
    ]);

    expect(slices.map((s) => s.kind)).toEqual(['supplier', 'supplier', 'supplier', 'supplier', 'supplier']);
  });

  it('groups everything after the top four when there are six or more', () => {
    const slices = supplierValueSlices([
      point('A', 60), point('B', 50), point('C', 40), point('D', 30), point('E', 20), point('F', 10),
    ]);

    expect(slices).toEqual([
      { kind: 'supplier', name: 'A', value: 60 },
      { kind: 'supplier', name: 'B', value: 50 },
      { kind: 'supplier', name: 'C', value: 40 },
      { kind: 'supplier', name: 'D', value: 30 },
      { kind: 'others', value: 30, others: 2 },
    ]);
  });

  it('keeps the grouped slice last even when it is larger than every named slice', () => {
    const many = Array.from({ length: 20 }, (_, i) => point(`Small ${i}`, 5));
    const slices = supplierValueSlices([point('A', 40), point('B', 30), point('C', 20), point('D', 10), ...many]);

    expect(slices[4]).toEqual({ kind: 'others', value: 100, others: 20 });
  });

  it('ranks by value and orders equal values by name when the input is unsorted', () => {
    const slices = supplierValueSlices([
      point('Zulu', 10), point('Bravo', 30), point('Alpha', 30), point('Mike', 20),
    ]);

    expect(slices.map((s) => (s.kind === 'supplier' ? s.name : 'others'))).toEqual(['Alpha', 'Bravo', 'Mike', 'Zulu']);
  });

  it('leaves out suppliers without value before counting', () => {
    const slices = supplierValueSlices([
      point('A', 50), point('B', 40), point('C', 30), point('D', 20), point('E', 10), point('Idle', 0),
    ]);

    expect(slices).toHaveLength(5);
    expect(slices.every((s) => s.kind === 'supplier')).toBe(true);
  });

  it('returns no slices when no supplier holds value', () => {
    expect(supplierValueSlices([point('Idle', 0)])).toEqual([]);
  });
});
