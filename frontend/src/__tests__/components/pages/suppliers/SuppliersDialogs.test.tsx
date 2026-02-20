/**
 * @file SuppliersDialogs.test.tsx
 * @module __tests__/components/pages/suppliers/SuppliersDialogs
 * @description Contract tests for the `SuppliersDialogs` composition component.
 *
 * Contract under test:
 * - Renders the Create/Edit/Delete dialog components.
 * - Wires the board-level props to the correct child-dialog prop names.
 *
 * Out of scope:
 * - The internal rendering/behavior of each dialog (those are tested in their own suites).
 *
 * Test strategy:
 * - Replace each dialog with a spy-only test double and assert on the props it receives.
 * - Keep dialog prop capture typed as `unknown` so this test does not depend on dialog internals.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  SuppliersDialogs,
  type SuppliersDialogsProps,
} from '../../../../pages/suppliers/components/SuppliersDialogs';

const mocks = vi.hoisted(() => ({
  CreateSupplierDialog: vi.fn<[unknown], void>(),
  EditSupplierDialog: vi.fn<[unknown], void>(),
  DeleteSupplierDialog: vi.fn<[unknown], void>(),
}));

vi.mock('../../../../pages/suppliers/dialogs/CreateSupplierDialog', () => ({
  CreateSupplierDialog: (props: unknown) => {
    // We don't render dialog UI here; we only capture the props the composition layer passes down.
    mocks.CreateSupplierDialog(props);
    return null;
  },
}));

vi.mock('../../../../pages/suppliers/dialogs/EditSupplierDialog', () => ({
  EditSupplierDialog: (props: unknown) => {
    mocks.EditSupplierDialog(props);
    return null;
  },
}));

vi.mock('../../../../pages/suppliers/dialogs/DeleteSupplierDialog', () => ({
  DeleteSupplierDialog: (props: unknown) => {
    mocks.DeleteSupplierDialog(props);
    return null;
  },
}));

// Props builder: keeps tests focused on one contract variation at a time.
const createProps = (overrides: Partial<SuppliersDialogsProps> = {}): SuppliersDialogsProps => ({
  openCreate: false,
  onCloseCreate: vi.fn(),
  onCreated: vi.fn(),
  openEdit: false,
  onCloseEdit: vi.fn(),
  onUpdated: vi.fn(),
  openDelete: false,
  onCloseDelete: vi.fn(),
  onDeleted: vi.fn(),
  ...overrides,
});

const renderDialogs = (props: SuppliersDialogsProps) => render(<SuppliersDialogs {...props} />);

describe('SuppliersDialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wires props to dialog components', () => {
    const props = createProps({ openCreate: true, openEdit: true, openDelete: true });

    renderDialogs(props);

    expect(mocks.CreateSupplierDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        onClose: props.onCloseCreate,
        onCreated: props.onCreated,
      })
    );

    expect(mocks.EditSupplierDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        onClose: props.onCloseEdit,
        onSupplierUpdated: props.onUpdated,
      })
    );

    expect(mocks.DeleteSupplierDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        onClose: props.onCloseDelete,
        onSupplierDeleted: props.onDeleted,
      })
    );
  });

  it.each([
    { name: 'all closed', openCreate: false, openEdit: false, openDelete: false },
    { name: 'create open', openCreate: true, openEdit: false, openDelete: false },
    { name: 'edit open', openCreate: false, openEdit: true, openDelete: false },
    { name: 'delete open', openCreate: false, openEdit: false, openDelete: true },
    { name: 'all open', openCreate: true, openEdit: true, openDelete: true },
  ])('passes open flags ($name)', ({ openCreate, openEdit, openDelete }) => {
    renderDialogs(createProps({ openCreate, openEdit, openDelete }));

    expect(mocks.CreateSupplierDialog).toHaveBeenCalledWith(
      expect.objectContaining({ open: openCreate })
    );
    expect(mocks.EditSupplierDialog).toHaveBeenCalledWith(
      expect.objectContaining({ open: openEdit })
    );
    expect(mocks.DeleteSupplierDialog).toHaveBeenCalledWith(
      expect.objectContaining({ open: openDelete })
    );
  });
});
