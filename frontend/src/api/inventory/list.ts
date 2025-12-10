/**
 * @file list.ts
 * @module api/inventory/list
 *
 * @summary
 * Coordinator barrel export for inventory list operations.
 * Maintains backward compatibility by re-exporting from focused modules.
 *
 * @enterprise
 * - Enables focused single-responsibility modules (listFetcher, rowNormalizers)
 * - Preserves existing import paths: `import { getInventoryPage } from '@/api/inventory'`
 * - Zero breaking changes for consuming components
 */

// Main API export
export { getInventoryPage } from './listFetcher';

// Normalization utilities (internal, for testing/reuse)
export { toInventoryRow } from './rowNormalizers';
