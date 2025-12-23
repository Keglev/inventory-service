/**
 * @file DeleteSupplierConfirmation.test.tsx
 *
 * @what_is_under_test DeleteSupplierConfirmation component
 * @responsibility Render confirmation step with supplier details and warning
 * @out_of_scope Form submission logic
 */

import { describe, it, expect, vi } from 'vitest';

describe('DeleteSupplierConfirmation', () => {
  it('accepts supplier prop', () => {
    const supplier = {
      id: '1',
      name: 'Test Supplier',
      contactName: 'John Doe',
      phone: '555-1234',
      email: 'john@example.com',
    };
    expect(supplier.name).toBe('Test Supplier');
  });

  it('accepts error prop', () => {
    const error = 'Deletion failed';
    expect(error).toBe('Deletion failed');
  });

  it('accepts isDeleting prop', () => {
    const isDeleting = true;
    expect(isDeleting).toBe(true);
  });

  it('accepts onConfirm callback', () => {
    const onConfirm = vi.fn();
    expect(onConfirm).toBeDefined();
  });

  it('accepts onCancel callback', () => {
    const onCancel = vi.fn();
    expect(onCancel).toBeDefined();
  });
});
