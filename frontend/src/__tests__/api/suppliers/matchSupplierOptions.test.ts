/**
 * @file matchSupplierOptions.test.ts
 * @module __tests__/api/suppliers/matchSupplierOptions
 * @description The supplier matcher behind SupplierPickerField: the name contains the typed
 *   fragment, ignoring case, from two letters (S2-9).
 */
import { describe, expect, it } from 'vitest';
import { matchSupplierOptions } from '@/api/suppliers/matchSupplierOptions';
import type { SupplierOption } from '@/api/analytics/types';

const suppliers: SupplierOption[] = [
  { id: 's1', label: 'Nordbay Industriebedarf GmbH' },
  { id: 's2', label: 'Nordlicht Werkzeuge GmbH' },
  { id: 's3', label: 'Steelcraft Components Ltd.' },
];

describe('matchSupplierOptions', () => {
  it('matches the name anywhere, ignoring case, from two letters', () => {
    expect(matchSupplierOptions(suppliers, 'NORD').map((s) => s.id)).toEqual(['s1', 's2']);
    expect(matchSupplierOptions(suppliers, 'craft').map((s) => s.id)).toEqual(['s3']);
    expect(matchSupplierOptions(suppliers, 'n')).toEqual([]);
  });
});
