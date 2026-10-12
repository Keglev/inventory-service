/**
 * @file chartLegend.test.ts
 * @module tests/utils/chartLegend
 * @testing legendOrder
 * @description Legend items sort by their position in the key list, independent of
 *   the translated label; unknown or non-string dataKeys go last. Sibling:
 *   chartLegendStandard.test.ts (every chart legend declares its order).
 */
import { describe, it, expect } from 'vitest';
import type { LegendPayload } from 'recharts';
import { legendOrder } from '@/utils/chartLegend';

const item = (dataKey: LegendPayload['dataKey'], value: string): LegendPayload => ({ dataKey, value });

describe('legendOrder', () => {
  it('orders items by the key list, not by label', () => {
    const sorter = legendOrder(['stockIn', 'stockOut']);
    // German labels sort "Lagerabgang" before "Lagerzugang"; the key list must win.
    const items = [item('stockOut', 'Lagerabgang'), item('stockIn', 'Lagerzugang')];
    expect([...items].sort((a, b) => sorter(a) - sorter(b)).map((i) => i.value)).toEqual(['Lagerzugang', 'Lagerabgang']);
  });

  it('puts unknown and non-string dataKeys after the listed ones', () => {
    const sorter = legendOrder(['a', 'b']);
    expect(sorter(item('b', 'B'))).toBe(1);
    expect(sorter(item('zzz', 'Z'))).toBe(2);
    expect(sorter(item((row: unknown) => row, 'F'))).toBe(2);
  });
});
