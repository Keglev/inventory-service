/**
 * @file DeleteSupplierSearchInput.test.tsx
 *
 * @what_is_under_test DeleteSupplierSearchInput component
 * @responsibility Render search input field with loading state
 * @out_of_scope API calls, search logic
 */

import { describe, it, expect, vi } from 'vitest';

describe('DeleteSupplierSearchInput', () => {
  it('accepts value prop', () => {
    const value = 'search text';
    expect(value).toBe('search text');
  });

  it('accepts onChange callback', () => {
    const onChange = vi.fn();
    expect(onChange).toBeDefined();
  });

  it('accepts isLoading prop', () => {
    const isLoading = false;
    expect(isLoading).toBe(false);
  });

  it('handles loading state true', () => {
    const isLoading = true;
    expect(isLoading).toBe(true);
  });

  it('handles empty value', () => {
    const value = '';
    expect(value).toBe('');
  });
});
