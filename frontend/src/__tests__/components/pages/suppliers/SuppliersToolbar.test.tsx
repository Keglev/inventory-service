/**
 * @file SuppliersToolbar.test.tsx
 * @module __tests__/components/pages/suppliers/SuppliersToolbar
 * @description Contract tests for the `SuppliersToolbar` presentation component.
 *
 * Contract under test:
 * - Renders the board title and the three action buttons.
 * - Reflects enablement via the `editEnabled`/`deleteEnabled` props.
 * - Delegates user intent via callbacks: `onCreateClick`, `onEditClick`, `onDeleteClick`.
 *
 * Out of scope:
 * - MUI layout/styling and button implementation details.
 *
 * Test strategy:
 * - Assert visible text and accessible button roles.
 * - Use table-driven cases for enablement to reduce duplication.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SuppliersToolbar,
  type SuppliersToolbarProps,
} from '../../../../pages/suppliers/components/SuppliersToolbar';
import { tEn } from '../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

// Props builder: keeps tests focused on the prop(s) under test.
const createProps = (overrides: Partial<SuppliersToolbarProps> = {}): SuppliersToolbarProps => ({
  onCreateClick: vi.fn(),
  editEnabled: false,
  onEditClick: vi.fn(),
  deleteEnabled: false,
  onDeleteClick: vi.fn(),
  ...overrides,
});

const renderToolbar = (props: SuppliersToolbarProps) => render(<SuppliersToolbar {...props} />);

describe('SuppliersToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title + action buttons', () => {
    renderToolbar(createProps());

    expect(screen.getByText('Supplier Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Supplier' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it.each([
    {
      name: 'create is always enabled',
      props: createProps(),
      buttonName: 'Add Supplier',
      enabled: true,
    },
    {
      name: 'edit is disabled by default',
      props: createProps({ editEnabled: false }),
      buttonName: 'Edit',
      enabled: false,
    },
    {
      name: 'edit is enabled when requested',
      props: createProps({ editEnabled: true }),
      buttonName: 'Edit',
      enabled: true,
    },
    {
      name: 'delete is disabled by default',
      props: createProps({ deleteEnabled: false }),
      buttonName: 'Delete',
      enabled: false,
    },
    {
      name: 'delete is enabled when requested',
      props: createProps({ deleteEnabled: true }),
      buttonName: 'Delete',
      enabled: true,
    },
  ])('$name', ({ props, buttonName, enabled }) => {
    renderToolbar(props);

    const button = screen.getByRole('button', { name: buttonName });
    if (enabled) {
      expect(button).not.toBeDisabled();
    } else {
      expect(button).toBeDisabled();
    }
  });

  it('delegates clicks to the provided handlers', async () => {
    const user = userEvent.setup();
    const props = createProps({ editEnabled: true, deleteEnabled: true });

    renderToolbar(props);

    await user.click(screen.getByRole('button', { name: 'Add Supplier' }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(props.onCreateClick).toHaveBeenCalledTimes(1);
    expect(props.onEditClick).toHaveBeenCalledTimes(1);
    expect(props.onDeleteClick).toHaveBeenCalledTimes(1);
  });
});
