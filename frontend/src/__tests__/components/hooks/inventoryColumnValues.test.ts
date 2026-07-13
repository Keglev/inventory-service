/**
 * @file inventoryColumnValues.test.ts
 * @module __tests__/components/hooks/inventoryColumnValues
 * @description Pure value resolvers and formatters behind the inventory
 * grid columns.
 *
 * Contract under test:
 * - Row-shape tolerance: normalized fields (onHand, minQty) win, backend
 *   fields (quantity, minimumQuantity incl. numeric strings) are accepted,
 *   absent/malformed values degrade to 0 or null instead of crashing.
 * - totalValue prefers the server-computed figure and falls back to
 *   price x onHand.
 * - Count/money/date formatters honor the user's preference tokens and
 *   render an em-dash for absent or unparseable values.
 */
import { describe, it, expect } from 'vitest';

import {
  resolveOnHand,
  resolveMinQty,
  resolvePrice,
  resolveTotalValue,
  formatCount,
  formatMoney,
  formatDateCell,
} from '../../../pages/inventory/hooks/inventoryColumnValues';
import type { InventoryRow } from '../../../api/inventory/types';

const EM_DASH = '\u2014';

function row(fields: Record<string, unknown>): InventoryRow {
  return fields as unknown as InventoryRow;
}

describe('resolveOnHand', () => {
  it('returns 0 for a null row', () => {
    expect(resolveOnHand(null)).toBe(0);
  });

  it('prefers the normalized onHand count', () => {
    expect(resolveOnHand(row({ onHand: 5, quantity: 9 }))).toBe(5);
  });

  it('falls back to the backend quantity when onHand is absent or malformed', () => {
    expect(resolveOnHand(row({ quantity: 9 }))).toBe(9);
    expect(resolveOnHand(row({ onHand: Number.NaN, quantity: 9 }))).toBe(9);
  });

  it('returns 0 when both fields are absent or malformed', () => {
    expect(resolveOnHand(row({}))).toBe(0);
    expect(resolveOnHand(row({ onHand: Infinity, quantity: null }))).toBe(0);
  });
});

describe('resolveMinQty', () => {
  it('returns 0 for a null row', () => {
    expect(resolveMinQty(null)).toBe(0);
  });

  it('prefers the normalized numeric minQty', () => {
    expect(resolveMinQty(row({ minQty: 3, minimumQuantity: 8 }))).toBe(3);
  });

  it('accepts the backend minimumQuantity, including numeric strings', () => {
    expect(resolveMinQty(row({ minimumQuantity: 8 }))).toBe(8);
    expect(resolveMinQty(row({ minimumQuantity: '12' }))).toBe(12);
  });

  it('degrades malformed values to 0', () => {
    expect(resolveMinQty(row({ minimumQuantity: 'abc' }))).toBe(0);
    expect(resolveMinQty(row({ minimumQuantity: '   ' }))).toBe(0);
    expect(resolveMinQty(row({ minQty: Number.NaN }))).toBe(0);
    expect(resolveMinQty(row({}))).toBe(0);
  });
});

describe('resolvePrice', () => {
  it('returns null for a null row or malformed price', () => {
    expect(resolvePrice(null)).toBeNull();
    expect(resolvePrice(row({}))).toBeNull();
    expect(resolvePrice(row({ price: Number.NaN }))).toBeNull();
  });

  it('returns the finite unit price', () => {
    expect(resolvePrice(row({ price: 2.5 }))).toBe(2.5);
  });
});

describe('resolveTotalValue', () => {
  it('returns null for a null row', () => {
    expect(resolveTotalValue(null)).toBeNull();
  });

  it('prefers the server-computed total', () => {
    expect(resolveTotalValue(row({ totalValue: 42, price: 2, onHand: 3 }))).toBe(42);
  });

  it('falls back to price x onHand when the backend omits the total', () => {
    expect(resolveTotalValue(row({ price: 2.5, onHand: 4 }))).toBe(10);
  });

  it('returns null when neither total nor price is usable', () => {
    expect(resolveTotalValue(row({ totalValue: Number.NaN, price: null, onHand: 4 }))).toBeNull();
  });
});

describe('formatCount', () => {
  it('formats numbers as grouped integers per the preference token', () => {
    expect(formatCount(1234, 'DE')).toBe('1.234');
    expect(formatCount(1234, 'EN_US')).toBe('1,234');
  });

  it('accepts numeric strings', () => {
    expect(formatCount('1234', 'DE')).toBe('1.234');
  });

  it('degrades empty, non-numeric, and non-finite input to 0', () => {
    expect(formatCount('', 'DE')).toBe('0');
    expect(formatCount('abc', 'DE')).toBe('0');
    expect(formatCount(null, 'DE')).toBe('0');
    expect(formatCount(Infinity, 'DE')).toBe('0');
  });
});

describe('formatMoney', () => {
  it('renders two decimals per the preference token', () => {
    expect(formatMoney(1234.5, 'DE')).toBe('1.234,50');
    expect(formatMoney(1234.5, 'EN_US')).toBe('1,234.50');
  });

  it('renders an em-dash for absent or malformed values', () => {
    expect(formatMoney(null, 'DE')).toBe(EM_DASH);
    expect(formatMoney('12', 'DE')).toBe(EM_DASH);
    expect(formatMoney(Number.NaN, 'DE')).toBe(EM_DASH);
  });
});

describe('formatDateCell', () => {
  it('renders an em-dash for empty input', () => {
    expect(formatDateCell(null, 'DD.MM.YYYY')).toBe(EM_DASH);
    expect(formatDateCell(undefined, 'DD.MM.YYYY')).toBe(EM_DASH);
    expect(formatDateCell('', 'DD.MM.YYYY')).toBe(EM_DASH);
  });

  it('renders an em-dash for unparseable input', () => {
    expect(formatDateCell('not-a-date', 'DD.MM.YYYY')).toBe(EM_DASH);
  });

  it('formats parseable dates per the preference token', () => {
    expect(formatDateCell('2026-05-01T00:00:00Z', 'DD.MM.YYYY')).toBe('01.05.2026');
    expect(formatDateCell('2026-05-01T00:00:00Z', 'YYYY-MM-DD')).toBe('2026-05-01');
  });
});
