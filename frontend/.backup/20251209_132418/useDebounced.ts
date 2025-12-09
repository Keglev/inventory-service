/**
* @file useDebounced.ts
* @module pages/analytics/hooks/useDebounced
*
* @summary
* Minimal string debounce hook for type-ahead inputs.
*/
import * as React from 'react';

/** Debounce a string value by `ms` milliseconds. */
export function useDebounced(value: string, ms = 250): string {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const h = setTimeout(() => setV(value), ms);
        return () => clearTimeout(h);
    }, [value, ms]);
    return v;
}