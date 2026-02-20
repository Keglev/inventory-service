/**
 * @file SuppliersFilterPanel.test.tsx
 * @module __tests__/components/pages/suppliers/SuppliersFilterPanel
 * @description Contract tests for the `SuppliersFilterPanel` presentation component.
 *
 * Contract under test:
 * - Renders the toggle label + helper hint text.
 * - Projects `showAllSuppliers` into the checkbox checked state.
 * - Delegates user intent via `onToggleChange(nextValue)`.
 *
 * Out of scope:
 * - MUI layout/styling and internal checkbox implementation details.
 *
 * Test strategy:
 * - Assert accessible roles/text (stable i18n fallbacks), not DOM structure.
 * - Use table-driven cases for projection and toggle payloads.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SuppliersFilterPanel,
  type SuppliersFilterPanelProps,
} from '../../../../pages/suppliers/components/SuppliersFilterPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

// Props builder: keeps tests focused on a small number of inputs.
const createProps = (
  overrides: Partial<SuppliersFilterPanelProps> = {}
): SuppliersFilterPanelProps => ({
  showAllSuppliers: false,
  onToggleChange: vi.fn(),
  ...overrides,
});

const renderPanel = (props: SuppliersFilterPanelProps) =>
  render(<SuppliersFilterPanel {...props} />);

describe('SuppliersFilterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the toggle checkbox + helper text', () => {
    renderPanel(createProps());

    expect(screen.getByRole('checkbox', { name: 'Show all suppliers' })).toBeInTheDocument();
    expect(
      screen.getByText('Check this box to display the complete supplier list')
    ).toBeInTheDocument();
  });

  it.each([
    { showAllSuppliers: false, expectedChecked: false },
    { showAllSuppliers: true, expectedChecked: true },
  ])('projects checked state (showAllSuppliers=$showAllSuppliers)', ({
    showAllSuppliers,
    expectedChecked,
  }) => {
    renderPanel(createProps({ showAllSuppliers }));

    const checkbox = screen.getByRole('checkbox', { name: 'Show all suppliers' });
    if (expectedChecked) {
      expect(checkbox).toBeChecked();
    } else {
      expect(checkbox).not.toBeChecked();
    }
  });

  it.each([
    { initial: false, expected: true },
    { initial: true, expected: false },
  ])('emits the next value on toggle (initial=$initial)', async ({ initial, expected }) => {
    const user = userEvent.setup();
    const props = createProps({ showAllSuppliers: initial });

    renderPanel(props);
    await user.click(screen.getByRole('checkbox', { name: 'Show all suppliers' }));

    expect(props.onToggleChange).toHaveBeenCalledTimes(1);
    expect(props.onToggleChange).toHaveBeenCalledWith(expected);
  });
});
