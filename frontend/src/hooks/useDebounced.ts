/**
 * @file useDebounced.ts
 * @description
 * Generic debounce hook for delaying value updates.
 * Useful for debouncing search queries, text input, or any value type.
 * Reduces server chatter and UI updates while user is typing.
 *
 * @usage
 * const debouncedSearchTerm = useDebounced(searchTerm, 350)
 * const debouncedQuery = useDebounced(itemQuery, 250)
 */

import * as React from 'react';

/**
 * Debounce a value by a specified delay in milliseconds.
 * @template T - The type of value to debounce
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds (default: 250)
 * @returns The debounced value
 * @example
 * const debouncedSearch = useDebounced(searchInput, 500)
 */
export function useDebounced<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}
