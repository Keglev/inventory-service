/**
 * @file supplierMutations.ts
 * @module api/suppliers/supplierMutations
 *
 * @summary
 * POST / PUT / DELETE operations for the supplier resource.
 *
 * @enterprise
 * - errorMessage and extractApiError are borrowed from api/shared — not supplier-owned helpers.
 * - Error shape from the backend is {error, message, timestamp, fieldErrors?}. The status code, the
 *   status token and fieldErrors are carried through alongside the message, because callers classify
 *   failures from the envelope rather than by matching substrings in the free-text message.
 * - All three functions return {success, error?, ...envelope} so callers never need to catch.
 */

import http from '../httpClient';
import type { SupplierRow, SupplierDTO } from './types';
import { toSupplierRow } from './supplierNormalizers';
import { errorMessage, extractApiError } from '../shared/errorHandling';
import { SUPPLIERS_BASE } from './supplierListFetcher';

/**
 * Structured failure detail lifted from the backend error envelope. Present on
 * every failed mutation result; callers classify from these, never from `error`.
 */
export interface SupplierMutationFailure {
  /** Status token: HttpStatus.name().toLowerCase(), e.g. 'conflict'. */
  errorToken?: string | null;
  status?: number | null;
  /** Per-field messages, e.g. { name: '...' } for a duplicate supplier name. */
  fieldErrors?: Record<string, string> | null;
}

export type SupplierWriteResult = { success: SupplierRow | null; error?: string } & SupplierMutationFailure;
export type SupplierDeleteResult = { success: boolean; error?: string } & SupplierMutationFailure;

/** Collapses an unknown thrown value into the structured failure shape. */
const toFailure = (err: unknown): SupplierMutationFailure & { error: string } => {
  const api = extractApiError(err);
  return {
    error: errorMessage(err),
    errorToken: api.token,
    status: api.status,
    fieldErrors: api.fieldErrors,
  };
};

/**
 * Creates a new supplier via POST /api/suppliers.
 *
 * @param supplier - DTO to POST; omit id and createdAt — both are auto-filled by the backend.
 * @returns Created supplier with system-generated id, or error message
 *
 * @example
 * ```typescript
 * const { success, error } = await createSupplier({
 *   name: 'ACME Corp',
 *   email: 'contact@acme.com'
 * });
 * if (success) console.log(success.id);
 * ```
 */
export const createSupplier = async (
  supplier: SupplierDTO,
): Promise<SupplierWriteResult> => {
  try {
    const resp = await http.post(SUPPLIERS_BASE, supplier);

    // httpClient passes through the raw Axios response without unwrapping; extract .data here
    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : {};

    const created = toSupplierRow(data);
    return {
      success: created,
      error: created ? undefined : 'Invalid response from server',
    };
  } catch (err) {
    return { success: null, ...toFailure(err) };
  }
};

/**
 * Updates a supplier via PUT /api/suppliers/:id.
 *
 * @param id - Supplier ID
 * @param supplier - Full DTO to PUT; id in the path takes precedence over any id field in the body.
 * @returns Updated supplier, or error message
 *
 * @example
 * ```typescript
 * const { success, error } = await updateSupplier('sup-123', {
 *   name: 'ACME Corp',
 *   email: 'newemail@acme.com',
 * });
 * ```
 */
export const updateSupplier = async (
  id: string,
  supplier: SupplierDTO,
): Promise<SupplierWriteResult> => {
  try {
    const resp = await http.put(`${SUPPLIERS_BASE}/${id}`, supplier);

    // httpClient passes through the raw Axios response without unwrapping; extract .data here
    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : {};

    const updated = toSupplierRow(data);
    return {
      success: updated,
      error: updated ? undefined : 'Invalid response from server',
    };
  } catch (err) {
    return { success: null, ...toFailure(err) };
  }
};

/**
 * Deletes a supplier via DELETE /api/suppliers/:id.
 *
 * @param id - Supplier ID
 * @returns Success status with optional error message
 *
 * @example
 * ```typescript
 * const { success, error } = await deleteSupplier('sup-123');
 * if (!success) console.error(error);
 * ```
 */
export const deleteSupplier = async (
  id: string,
): Promise<SupplierDeleteResult> => {
  try {
    await http.delete(`${SUPPLIERS_BASE}/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, ...toFailure(err) };
  }
};
