/**
 * @file utils.ts
 * @module api/inventory/utils
 *
 * @summary
 * Coordinator barrel export for inventory utilities.
 * Re-exports type guards, field pickers, error handling, and response extraction from focused modules.
 *
 * @enterprise
 * - Enables single-responsibility utility modules organized by concern
 * - Preserves existing import paths: `import { pickString, errorMessage } from '@/api/inventory/utils'`
 * - Zero breaking changes for consuming modules across inventory API layer
 * - Clear organization: typeGuards, fieldPickers, errorHandling, responseExtraction
 */

// Type narrowing helpers
export { isRecord } from './utils/typeGuards';

// Field extraction with safe coercion
export { pickString, pickNumber, pickNumberFromList, pickStringFromList } from './utils/fieldPickers';

// Error extraction and user-friendly messages
export { errorMessage } from './utils/errorHandling';

// Response envelope parsing
export { resDataOrEmpty, extractArray } from './utils/responseExtraction';
