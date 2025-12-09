/**
 * @file validation.ts
 * @module api/suppliers/validation
 *
 * @summary
 * Centralized validation schemas for supplier management forms.
 * Zod schemas for supplier create and edit operations.
 * These schemas mirror backend validation rules for client-side validation.
 *
 * Uses Zod for type-safe validation with custom error messages.
 *
 * @enterprise
 * - No any. Clear, field-level error messages suitable for form mapping.
 * - Schemas should echo backend validation for consistency.
 * - Email validation using built-in email validator
 * - Nullable fields for optional contact information
 */

import { z } from 'zod';

/**
 * Schema for creating a new supplier.
 * Handles supplier creation with optional contact information.
 * Mirrors backend validation in supplier controller.
 */
export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .trim(),
  contactName: z
    .string()
    .optional()
    .transform((v) => v || null),
  phone: z
    .string()
    .optional()
    .transform((v) => v || null),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .transform((v) => v || null),
});

export type CreateSupplierForm = z.infer<typeof createSupplierSchema>;

/**
 * Schema for editing supplier contact information.
 * Does NOT include name field - supplier name is immutable.
 * Only allows updating contactName, phone, and email.
 *
 * @remarks
 * Name is read-only to prevent duplicate/new supplier creation.
 * Changing a supplier's name is a business rule violation.
 */
export const editSupplierSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  contactName: z.string().nullable().catch(null),
  phone: z.string().nullable().catch(null),
  email: z.string().email('Invalid email format').nullable().catch(null),
});

export type EditSupplierForm = z.infer<typeof editSupplierSchema>;
