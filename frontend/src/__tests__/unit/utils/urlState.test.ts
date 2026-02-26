/**
 * @file urlState.test.ts
 * @module tests/unit/utils/urlState
 * @what_is_under_test readParams / writeParams
 * @responsibility
 * Guarantees stable URL query read/write contracts used by filter state:
 * - Reading: returns requested keys with decoded values (or undefined), with legacy handling.
 * - Writing: adds/updates/removes parameters and returns an expected search string surface.
 * @out_of_scope
 * Browser URL routing integration (history updates, location synchronization).
 * @out_of_scope
 * Full encoding edge cases across all Unicode and reserved characters.
 */

import { describe, expect, it } from 'vitest';
import { readParams, writeParams } from '@/utils/urlState';

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

describe('writeParams', () => {
  describe('success paths', () => {
    it('adds a new parameter to an empty search', () => {
      const result = writeParams('', { from: '2023-01-01' });
      expect(result).toBe('?from=2023-01-01');
    });

    it('adds multiple parameters', () => {
      const result = writeParams('', {
        from: '2023-01-01',
        to: '2023-12-31',
        supplierId: 'S123',
      });

      expect(result).toContain('from=2023-01-01');
      expect(result).toContain('to=2023-12-31');
      expect(result).toContain('supplierId=S123');
    });

    it('updates an existing parameter', () => {
      const result = writeParams('?from=2023-01-01', { from: '2024-01-01' });
      expect(result).toBe('?from=2024-01-01');
    });

    it('preserves unmodified parameters', () => {
      const result = writeParams('?from=2023-01-01&to=2023-12-31', {
        supplierId: 'S123',
      });

      expect(result).toContain('from=2023-01-01');
      expect(result).toContain('to=2023-12-31');
      expect(result).toContain('supplierId=S123');
    });

    it('trims whitespace from values', () => {
      const result = writeParams('', { from: '  2023-01-01  ' });
      expect(result).toBe('?from=2023-01-01');
    });

    it('handles multiple updates and removals', () => {
      const result = writeParams('?from=2023-01-01&to=2023-12-31&supplierId=OLD', {
        from: '2024-01-01',
        to: undefined,
        supplierId: 'NEW',
        extra: 'value',
      });

      expect(result).toContain('from=2024-01-01');
      expect(result).not.toContain('to=');
      expect(result).toContain('supplierId=NEW');
      expect(result).toContain('extra=value');
    });
  });

  describe('removal semantics', () => {
    it.each([
      ['undefined', undefined],
      ['null', null as unknown as string],
      ['empty string', ''],
    ])('removes a parameter when value is %s', (_label, value) => {
      const result = writeParams('?from=2023-01-01&to=2023-12-31', { to: value as never });
      expect(result).toBe('?from=2023-01-01');
    });

    it('returns empty string when all params are removed', () => {
      const result = writeParams('?from=2023-01-01', { from: undefined });
      expect(result).toBe('');
    });
  });
});
