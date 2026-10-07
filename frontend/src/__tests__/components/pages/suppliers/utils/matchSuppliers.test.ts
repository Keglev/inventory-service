/**
 * @file matchSuppliers.test.ts
 * @module __tests__/components/pages/suppliers/utils/matchSuppliers
 * @description Contract tests for the browser-side supplier match.
 *
 * Contract under test:
 * - Case-insensitive, fragment anywhere in the name (the backend's rule).
 * - Nothing below two characters after trimming; list order is kept.
 */

import { describe, it, expect } from 'vitest';
import { matchSuppliers } from '@/pages/suppliers/utils/matchSuppliers';
import { SEARCH_MIN_CHARS } from '@/utils/searchFragment';
import type { SupplierRow } from '@/api/suppliers/types';

const row = (id: string, name: string): SupplierRow => ({ id, name, contactName: null, email: null, phone: null });
const list = [row('1', 'Nordbay Industriebedarf GmbH'), row('2', 'TechSeal Dichtungen GmbH'), row('3', 'Obi markt')];

describe('matchSuppliers', () => {
  it('requires two characters', () => {
    expect(SEARCH_MIN_CHARS).toBe(2);
    expect(matchSuppliers(list, 'n')).toEqual([]);
    expect(matchSuppliers(list, '  n  ')).toEqual([]);
  });

  it('matches anywhere in the name, ignoring case', () => {
    expect(matchSuppliers(list, 'DICHT')).toEqual([list[1]]);
    expect(matchSuppliers(list, 'ech')).toEqual([list[1]]);
    expect(matchSuppliers(list, ' markt ')).toEqual([list[2]]);
  });

  it('keeps list order and returns every match', () => {
    expect(matchSuppliers(list, 'gmbh')).toEqual([list[0], list[1]]);
  });

  it('returns nothing when no name contains the fragment', () => {
    expect(matchSuppliers(list, 'xyz')).toEqual([]);
  });
});
