/**
 * @module api/shared/types
 *
 * Cross-cutting domain types shared by the inventory and analytics API
 * layers. ItemRef lives here (rather than in either domain module) so that
 * the shared item-search primitives in itemSearch.ts and their consumers in
 * both layers depend on one canonical definition.
 */

/** Minimal item identity for type-ahead and dropdown controls; optional fields are included when callers need richer context (on-hand stock, price). */
export type ItemRef = { id: string; name: string; supplierId?: string | null; onHand?: number; price?: number };
