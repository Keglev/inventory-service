/**
 * @file entityColors.ts
 * @module utils/entityColors
 * @summary Gives each entity (an employee, keyed by email) a colour from a
 *   palette that depends on its key, not on its position in the current list.
 * @enterprise
 * Colour must follow the entity: coloured by index, an employee changed colour
 * when the granularity or range changed which employees were present (fork 7,
 * Carlos 2026-10-13). A hash of the key picks the slot. When two keys in view
 * hash to the same slot, the later key (in sorted order) takes the next free
 * slot, so the visible lines never share a colour; only a key that collides
 * with another visible key can move, and only while that key is in view.
 */

/** FNV-1a, 32 bit: small, stable across engines, spreads similar emails apart. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Assigns one palette colour per key.
 *
 * @param keys    stable entity keys (duplicates are ignored)
 * @param palette colours to choose from; with more keys than colours, slots repeat
 * @returns colour per key
 */
export function colorsByKey(keys: readonly string[], palette: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (palette.length === 0) return result;
  const taken = new Set<number>();
  for (const key of [...new Set(keys)].sort()) {
    if (taken.size === palette.length) taken.clear();
    let slot = fnv1a(key) % palette.length;
    while (taken.has(slot)) slot = (slot + 1) % palette.length;
    taken.add(slot);
    result[key] = palette[slot];
  }
  return result;
}
