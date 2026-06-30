/**
 * @module api/shared/constants
 *
 * @summary
 * Shared API base-path constants used across inventory and supplier domains.
 *
 * @enterprise
 * Centralizing API base paths prevents drift between modules that hit the
 * same backend resource. Each constant is the single source of truth for
 * its endpoint family; route literals built from these constants stay in
 * lockstep with backend controller mappings.
 */

/** Inventory API base path. Source of truth for all inventory endpoint URLs. */
export const INVENTORY_BASE = '/api/inventory';
