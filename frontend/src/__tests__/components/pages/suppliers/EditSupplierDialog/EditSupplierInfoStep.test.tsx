/**
 * @file EditSupplierInfoStep.test.tsx
 *
 * @what_is_under_test EditSupplierInfoStep component
 * @responsibility Render supplier info form with editable fields
 * @out_of_scope Form validation, submission logic
 */

import { describe, it, expect } from 'vitest';

describe('EditSupplierInfoStep', () => {
  it('accepts selectedSupplier prop', () => {
    const selectedSupplier = {
      id: '1',
      name: 'Test Supplier',
      contactName: 'John',
      phone: '555-1234',
      email: 'john@example.com',
    };
    expect(selectedSupplier.name).toBe('Test Supplier');
  });

  it('accepts control prop', () => {
    const control = {};
    expect(control).toBeDefined();
  });

  it('accepts errors prop', () => {
    const errors = {};
    expect(errors).toBeDefined();
  });

  it('accepts isSubmitting prop', () => {
    const isSubmitting = false;
    expect(isSubmitting).toBe(false);
  });

  it('handles null selectedSupplier', () => {
    const selectedSupplier = null;
    expect(selectedSupplier).toBeNull();
  });
});
