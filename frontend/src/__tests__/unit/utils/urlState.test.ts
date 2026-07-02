/**
 * @file urlState.test.ts
 * @module tests/unit/utils/urlState
 * @what_is_under_test readParams
 * @responsibility
 * Guarantees stable URL query read contracts used by filter state:
 * - Reading: returns requested keys with decoded values (or undefined), with legacy handling.
 * @out_of_scope
 * Browser URL routing integration (history updates, location synchronization).
 * @out_of_scope
 * Full encoding edge cases across all Unicode and reserved characters.
 */

import { describe, expect, it } from 'vitest';
import { readParams } from '@/utils/urlState';

describe('readParams', () => {
  describe('success paths', () => {
    it.each([
      ['?from=2023-01-01', ['from'], { from: '2023-01-01' }],
      [
        '?from=2023-01-01&to=2023-12-31&supplierId=S123',
        ['from', 'to', 'supplierId'],
        { from: '2023-01-01', to: '2023-12-31', supplierId: 'S123' },
      ],
      [
        '?from=2023-01-01',
        ['from', 'to', 'supplierId'],
        { from: '2023-01-01', to: undefined, supplierId: undefined },
      ],
      ['?supplierId=%22ABC123%22', ['supplierId'], { supplierId: 'ABC123' }],
      ['?supplierid=LEG123', ['supplierId'], { supplierId: 'LEG123' }],
      ['?supplierId=NEW123&supplierid=OLD123', ['supplierId'], { supplierId: 'NEW123' }],
      ['?key=value', ['key'], { key: 'value' }],
      ['key=value', ['key'], { key: 'value' }],
      [
        '?from=%222023-01-01%22&supplierId=%22S123%22',
        ['from', 'supplierId'],
        { from: '"2023-01-01"', supplierId: 'S123' },
      ],
      ['?supplierId=%22%22', ['supplierId'], { supplierId: undefined }],
      [
        '?from=2023-01-01&name=Test%20Value',
        ['from', 'name'],
        { from: '2023-01-01', name: 'Test Value' },
      ],
    ])('reads %s', (search, keys, expected) => {
      expect(readParams(search, keys as never)).toEqual(expected);
    });
  });
});
