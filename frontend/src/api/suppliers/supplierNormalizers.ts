/**
 * @file supplierNormalizers.ts
 * @module api/suppliers/normalizers
 *
 * @summary
 * DTO normalization for supplier list rows.
 * Converts raw API responses to strongly-typed SupplierRow shapes.
 *
 * @enterprise
 * - Single responsibility: DTO → SupplierRow transformation
 * - Flexible field extraction with safe fallbacks
 * - Type-safe with full TypeScript support
 * - Reusable for both single rows and batch operations
 */

import type { SupplierRow } from './types';
import { pickString, pickNumber } from '../inventory/utils';

/**
 * Normalize a raw API response object into a strongly-typed SupplierRow.
 * Safely handles missing/misnamed fields from backend with intelligent fallbacks.
 *
 * @param raw - Raw DTO from API response
 * @returns SupplierRow with all fields safely extracted and coerced, or null if invalid
 *
 * @example
 * ```typescript
 * const rows = response.content
 *   .map(toSupplierRow)
 *   .filter((r): r is SupplierRow => r !== null);
 * ```
 */
export const toSupplierRow = (raw: unknown): SupplierRow | null => {
  if (typeof raw !== 'object' || raw === null) return null;

  const r = raw as Record<string, unknown>;

  // ID is required - try both string and number
  let id: string | null = pickString(r, 'id') ?? null;
  if (!id) {
    const numId = pickNumber(r, 'id');
    id = numId ? String(numId) : null;
  }
  if (!id) return null;

  // Name is required
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
