/**
 * @file supplierMutations.ts
 * @module api/suppliers/supplierMutations
 *
 * @summary
 * Supplier CRUD operations (create, update, delete).
 * Centralized mutation logic for supplier management.
 *
 * @enterprise
 * - Single responsibility: CRUD operations only
 * - Consistent error handling with user-friendly messages
 * - Type-safe requests and responses
 * - Normalization through shared normalizer
 */

import http from '../httpClient';
import type { SupplierRow, SupplierDTO } from './types';
import { toSupplierRow } from './supplierNormalizers';
import { errorMessage } from '../inventory/utils';
import { SUPPLIERS_BASE } from './supplierListFetcher';

/**
 * Create new supplier.
 *
 * @param supplier - Supplier data (id and createdAt are auto-filled by backend)
 * @returns Created supplier with system-generated id, or error message
 *
 * @example
 * ```typescript
 * const { success, error } = await createSupplier({
 *   name: 'ACME Corp',
 *   email: 'contact@acme.com'
 * });
 * if (success) console.log('Created:', success.id);
 * ```
 */
export const createSupplier = async (
  supplier: SupplierDTO,
): Promise<{ success: SupplierRow | null; error?: string }> => {
  try {
    const resp = await http.post(SUPPLIERS_BASE, supplier);

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
 * Update existing supplier.
 *
 * @param id - Supplier ID
 * @param supplier - Updated supplier data
 * @returns Updated supplier, or error message
 *
 * @example
 * ```typescript
 * const { success, error } = await updateSupplier('sup-123', {
 *   name: 'ACME Corp Updated',
 *   email: 'newemail@acme.com'
 * });
 * ```
 */
export const updateSupplier = async (
  id: string,
  supplier: SupplierDTO,
): Promise<{ success: SupplierRow | null; error?: string }> => {
  try {
    const resp = await http.put(`${SUPPLIERS_BASE}/${id}`, supplier);

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
 * Delete supplier by ID.
 *
 * @param id - Supplier ID to delete
 * @returns Success status with optional error message
 *
 * @example
 * ```typescript
 * const { success, error } = await deleteSupplier('sup-123');
 * if (!success) alert(error);
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
