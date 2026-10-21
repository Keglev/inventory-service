/**
 * @file movementTooltip.test.ts
 * @module __tests__/utils/movementTooltip
 * @testing movementTooltip, MOVEMENT_ORDER
 * @description Tooltip order and text shared by the two monthly stock-movement
 * charts (Analytics MovementLineCard, Dashboard MonthlyMovementMini).
 *
 * Contract under test:
 * - MOVEMENT_ORDER: stock in before stock out; an unknown key sorts last.
 * - The title is the month name, with the clipped date span when the window
 *   cuts the month.
 * - A numeric value reads as a whole count in the user's number format plus
 *   the given unit; anything else passes through.
 */
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { MOVEMENT_ORDER, movementTooltip } from '@/utils/movementTooltip';

const de = {
  from: '2026-04-15',
  to: '2026-10-12',
  lang: 'de',
  dateFormat: 'DD.MM.YYYY' as const,
  numberFormat: 'DE' as const,
  unit: 'Stk.',
};

// The Recharts formatter signatures take payload arguments the shared helper ignores.
type Loose = (...args: unknown[]) => ReactNode;

describe('MOVEMENT_ORDER', () => {
  it('sorts stock in before stock out and unknown keys last', () => {
    expect([{ dataKey: 'stockOut' }, { dataKey: 'other' }, { dataKey: 'stockIn' }].sort(
      (a, b) => MOVEMENT_ORDER(a) - MOVEMENT_ORDER(b),
    )).toEqual([{ dataKey: 'stockIn' }, { dataKey: 'stockOut' }, { dataKey: 'other' }]);
  });
});

describe('movementTooltip', () => {
  const tooltip = movementTooltip(de);
  const label = tooltip.labelFormatter as Loose;
  const value = tooltip.formatter as Loose;

  it('titles a month cut by the window with its clipped span', () => {
    expect(label('2026-04')).toBe('April 2026 (15.04.2026 – 30.04.2026)');
    expect(label('2026-05')).toBe('Mai 2026');
  });

  it('formats a count in the number format with the unit', () => {
    expect(value(1250)).toBe('1.250 Stk.');
    const en = movementTooltip({ ...de, numberFormat: 'EN_US', unit: 'pcs' }).formatter as Loose;
    expect(en(1250)).toBe('1,250 pcs');
  });

  it('passes a non-numeric value through unchanged', () => {
    expect(value('n/a')).toBe('n/a');
  });
});
