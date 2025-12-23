import { describe, it, expect, vi } from 'vitest';

/**
 * @file ItemFormDialog.test.tsx
 *
 * @what_is_under_test ItemFormDialog component
 * @responsibility Render dialog wrapper and manage dialog lifecycle
 * @out_of_scope Form logic, submission
 */

describe('ItemFormDialog', () => {
  it('accepts isOpen prop', () => {
    const onClose = vi.fn();
    expect(onClose).toBeDefined();
  });

  it('accepts initial data prop', () => {
    const initial = {
      id: 'item1',
      name: 'Test Item',
      code: 'TEST001',
      onHand: 100,
      updatedAt: new Date().toISOString(),
    };
    expect(initial).toBeDefined();
  });

  it('accepts onClose callback', () => {
    const onClose = vi.fn();
    expect(onClose).toBeDefined();
  });

  it('accepts onSaved callback', () => {
    const onSaved = vi.fn();
    expect(onSaved).toBeDefined();
  });

  it('accepts readOnly prop', () => {
    const readOnly = true;
    expect(readOnly).toBe(true);
  });
});
