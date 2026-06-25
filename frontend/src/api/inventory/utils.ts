/**
 * @module api/inventory/utils
 *
 * Barrel re-export for shared API utility modules.
 * Consumed by both the inventory and supplier API layers — do not treat as inventory-private.
 * Re-exports type guards, field pickers, error handling, and response extraction so callers
 * can import from a single stable path (`@/api/inventory/utils`) regardless of internal restructuring.
 */

// Type narrowing helpers
export { isRecord } from './utils/typeGuards';

// Field extraction with safe coercion
export { pickString, pickNumber, pickNumberFromList, pickStringFromList } from './utils/fieldPickers';

// Error extraction and user-friendly messages
export { errorMessage } from './utils/errorHandling';

// Response envelope parsing
export { resDataOrEmpty, extractArray } from './utils/responseExtraction';
