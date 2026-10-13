/**
 * @file entityColors.test.ts
 * @module tests/utils/entityColors
 * @testing Unit tests for colorsByKey.
 * @description
 * Contract under test:
 * - A key's colour does not depend on the order or the other keys in view.
 * - Keys in view never share a colour while the palette has room.
 * - Duplicate keys, an empty palette and more keys than colours are handled.
 */

import { describe, expect, it } from 'vitest';
import { colorsByKey } from '@/utils/entityColors';

const PALETTE = ['a', 'b', 'c', 'd'];
const EMAILS = ['ana.ferreira@example.com', 'demo-user-2@example.com', 'jonas.weber@example.com'];

describe('colorsByKey', () => {
  it('gives a key the same colour whatever order or company it comes in', () => {
    const all = colorsByKey(EMAILS, PALETTE);

    expect(colorsByKey([...EMAILS].reverse(), PALETTE)).toEqual(all);
    expect(colorsByKey(['demo-user-2@example.com'], PALETTE)['demo-user-2@example.com']).toBe(
      all['demo-user-2@example.com'],
    );
  });

  // The demo's ana and jonas hash to the same of four slots, so this exercises
  // the step to the next free slot.
  it('never gives two keys in view the same colour while the palette has room', () => {
    expect(new Set(Object.values(colorsByKey(EMAILS, PALETTE))).size).toBe(3);
  });

  it('repeats colours only when there are more keys than colours', () => {
    const keys = Array.from({ length: 6 }, (_, i) => `user-${i}@example.com`);
    const colours = Object.values(colorsByKey(keys, PALETTE));

    expect(colours).toHaveLength(6);
    expect(new Set(colours).size).toBe(4);
  });

  it('ignores duplicate keys and returns nothing for an empty palette', () => {
    expect(Object.keys(colorsByKey(['x', 'x'], PALETTE))).toEqual(['x']);
    expect(colorsByKey(['x'], [])).toEqual({});
  });
});
