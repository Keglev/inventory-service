/**
 * @file supplierMutations.ts
 * @module api/suppliers/supplierMutations
 *
 * @summary
 * POST / PUT / DELETE operations for the supplier resource.
 *
 * @enterprise
 * - errorMessage is borrowed from api/shared — not a supplier-owned helper.
 * - Error shape from the backend is {error, message, timestamp}; errorMessage extracts the message field.
 * - All three functions return {success, error?} so callers never need to catch; errors surface as strings.
 */

import http from '../httpClient';
import type { SupplierRow, SupplierDTO } from './types';
import { toSupplierRow } from './supplierNormalizers';
import { errorMessage } from '../shared/errorHandling';
import { SUPPLIERS_BASE } from './supplierListFetcher';

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
): Promise<{ success: SupplierRow | null; error?: string }> => {
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
    return {
      success: null,
      error: errorMessage(err),
    };
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
): Promise<{ success: SupplierRow | null; error?: string }> => {
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
    return {
      success: null,
      error: errorMessage(err),
    };
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
): Promise<{ success: boolean; error?: string }> => {
  try {
    await http.delete(`${SUPPLIERS_BASE}/${id}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: errorMessage(err),
    };
  }
};
