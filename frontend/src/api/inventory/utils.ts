/**
 * @module api/inventory/utils
 *
 * Barrel re-export for shared API utility modules.
 * Consumed by both the inventory and supplier API layers — do not treat as inventory-private.
 * Re-exports type guards, field pickers, error handling, and response extraction so callers
 * can import from a single stable path (`@/api/inventory/utils`) regardless of internal restructuring.
 */

export { isRecord, pickString, pickNumber, pickNumberFromList, pickStringFromList, errorMessage, resDataOrEmpty, extractArray } from '@/api/shared';
