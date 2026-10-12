/**
 * @file stockChangeColumns.test.ts
 * @module __tests__/pages/analytics/sections/stockChangeColumns
 * @testing dateColumn, changeColumn, reasonColumn
 * @description The shared cells: the timestamp in the user's date format (raw
 *   value when it is not a date), the signed change in green or red, the
 *   translated reason (empty without one).
 */
import { describe, it, expect } from 'vitest';
import type { TFunction } from 'i18next';
import { changeColumn, dateColumn, reasonColumn } from '@/pages/analytics/sections/stockChangeColumns';

type Row = { ts: string; delta: number; reason?: string };
const t = ((key: string) => `t:${key}`) as unknown as TFunction<['analytics']>;

describe('stockChangeColumns', () => {
  it('formats the timestamp and falls back to the raw value', () => {
    const column = dateColumn<Row>('When', (r) => r.ts, 'DD.MM.YYYY');
    expect(column.header).toBe('When');
    expect(column.render({ ts: '2026-06-01T10:00:00', delta: 0 })).toBe('01.06.2026');
    expect(column.render({ ts: 'soon', delta: 0 })).toBe('soon');
  });

  it('signs the change, right-aligns it and colours it by direction', () => {
    const column = changeColumn<Row>('Change', (r) => r.delta, 'DE');
    expect(column.align).toBe('right');
    expect(column.render({ ts: '', delta: 1500 })).toBe('+1.500');
    expect(column.render({ ts: '', delta: -3 })).toBe('-3');
    expect(column.render({ ts: '', delta: 0 })).toBe('0');
    expect(column.sx?.({ ts: '', delta: -3 })).toEqual({ color: 'error.main', fontVariantNumeric: 'tabular-nums' });
    expect(column.sx?.({ ts: '', delta: 0 })).toEqual({ color: 'success.main', fontVariantNumeric: 'tabular-nums' });
  });

  it('translates the reason and leaves the cell empty without one', () => {
    const column = reasonColumn<Row>('Reason', (r) => r.reason, t);
    expect(column.render({ ts: '', delta: 0, reason: 'SOLD' })).toBe('t:analytics:reasons.SOLD');
    expect(column.render({ ts: '', delta: 0 })).toBe('');
  });
});
