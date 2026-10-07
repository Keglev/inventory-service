/**
 * @file matchItems.test.ts
 * @module tests/api/inventory/matchItems
 * @description Contract tests for the browser-side item match.
 *
 * Contract under test:
 * - The fragment anywhere in the name OR the SKU, ignoring case.
 * - Nothing below two characters after trimming; list order is kept.
 */

import { describe, expect, it } from 'vitest';
import { matchItems } from '@/api/inventory/matchItems';
import type { ItemRef } from '@/api/shared/types';

const items: ItemRef[] = [
  { id: '1', name: 'EUR-1 Wooden Pallet', sku: 'LOG-PAL-EUR1' },
  { id: '2', name: 'PET Strapping Band 16mm', sku: 'LOG-STRAP-16' },
  { id: '3', name: 'Kleber Ponal Express' },
];

describe('matchItems', () => {
  it('requires two characters after trimming', () => {
    expect(matchItems(items, 'p')).toEqual([]);
    expect(matchItems(items, '  p ')).toEqual([]);
  });

  it('matches anywhere in the name, ignoring case', () => {
    expect(matchItems(items, 'WOODEN')).toEqual([items[0]]);
    expect(matchItems(items, ' ponal ')).toEqual([items[2]]);
  });

  it('matches anywhere in the SKU, ignoring case', () => {
    expect(matchItems(items, 'strap-1')).toEqual([items[1]]);
    expect(matchItems(items, 'log-')).toEqual([items[0], items[1]]);
  });

  it('keeps list order, and an item without a SKU matches by name only', () => {
    expect(matchItems(items, 'e')).toEqual([]);
    expect(matchItems(items, 'ex')).toEqual([items[2]]);
  });

  it('returns nothing when neither name nor SKU contains the fragment', () => {
    expect(matchItems(items, 'xyz')).toEqual([]);
  });
});
