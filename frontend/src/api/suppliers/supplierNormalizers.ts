/**
 * @file supplierNormalizers.ts
 * @module api/suppliers/supplierNormalizers
 *
 * @summary
 * Converts raw SupplierDTO objects from GET /api/suppliers into strongly-typed SupplierRow values.
 *
 * @enterprise
 * - pickString and pickNumber are borrowed from api/inventory/utils — not supplier-owned helpers.
 * - Returns null for any DTO missing id or name so callers can filter invalid records without throwing.
 * - id is coerced from number to string defensively; the backend declares id as String but raw JSON
 *   may emit it as a number in legacy or test fixtures.
 */

import type { SupplierRow } from './types';
import { pickString, pickNumber } from '@/api/shared';

/**
 * Converts a single raw SupplierDTO into a SupplierRow.
 *
 * @param raw - Raw DTO from API response
 * @returns Normalized SupplierRow, or null if id or name is missing
 *
 * @example
 * ```typescript
 * const rows = (response.data as unknown[])
 *   .map(toSupplierRow)
 *   .filter((r): r is SupplierRow => r !== null);
 * ```
 */
export const toSupplierRow = (raw: unknown): SupplierRow | null => {
  if (typeof raw !== 'object' || raw === null) return null;

  const r = raw as Record<string, unknown>;

  // Try string first; fall back to number in case JSON serialized id as a numeric literal.
  let id: string | null = pickString(r, 'id') ?? null;
  if (!id) {
    const numId = pickNumber(r, 'id');
    id = numId ? String(numId) : null;
  }
  if (!id) return null;

  const name = pickString(r, 'name');
  if (!name) return null;

  return {
    id,
    name,
    contactName: pickString(r, 'contactName') ?? null,
    phone: pickString(r, 'phone') ?? null,
    email: pickString(r, 'email') ?? null,
    createdBy: pickString(r, 'createdBy') ?? null,
    createdAt: pickString(r, 'createdAt') ?? null,
  };
};
