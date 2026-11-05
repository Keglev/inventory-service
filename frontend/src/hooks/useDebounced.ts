/**
 * @file useDebounced.ts
 * @module hooks/useDebounced
 * @summary Generic value debouncer: delays propagation of a changing value by N
 *   milliseconds using useState + useEffect + setTimeout.
 * @enterprise
 * - Outlier in /hooks: NOT a context bridge. Pure behavioral hook.
 * - Consumers: the inventory board's search box (useInventoryPageData, 300 ms)
 *   and the analytics item search (useItemSearchOptions, 250 ms).
 * - Generic over T — value identity drives the effect dependency, so
 *   reference-stable inputs are the caller's responsibility.
 * - Cleanup clears the pending timeout on value or delay change, preventing
 *   stale-value writes.
 */

import * as React from 'react';

/**
 * Debounce a value by a specified delay in milliseconds.
 * @template T - The type of value to debounce
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds (default: 250)
 * @returns The debounced value
 */
export function useDebounced<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    // WHY: clear pending timeout so a rapid value change does not flush a stale prior value after the new effect schedules.
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}
