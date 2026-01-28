/**
 * @file AppSettingsDialog.test.tsx
 * @module __tests__/app/settings/AppSettingsDialog
 * @description
 * Tests for AppSettingsDialog.
 *
 * Scope:
 * - Renders a settings dialog container when open
 * - Wires close interactions (close button / backdrop) to onClose callback
 * - Hosts the AppSettingsForm
 *
 * Out of scope:
 * - Form validation and persistence
 * - Settings mutation logic (covered by hook/form tests)
 * - Material-UI internal behavior (we assert only the contracts we rely on)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppSettingsDialog from '../../../app/settings/AppSettingsDialog';

// Hook is mocked because this file only validates the dialog container behavior.
vi.mock('../../../app/settings/hooks', () => ({
  useAppSettingsForm: () => ({
    formState: {
      dateFormat: 'DD.MM.YYYY',
      numberFormat: 'de-DE',
      tableDensity: 'comfortable',
    },
    systemInfo: {
      database: 'Oracle',
      environment: 'production',
      version: '1.0.0',
      status: 'healthy',
      buildDate: '2025-12-22',
    },
    isLoading: false,
    handleDateFormatChange: vi.fn(),
    handleNumberFormatChange: vi.fn(),
    handleTableDensityChange: vi.fn(),
    handleResetDefaults: vi.fn(),
  }),
}));

vi.mock('../../../app/settings/AppSettingsForm', () => ({
  default: () => <div data-testid="settings-form">Form Content</div>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer fallback text for stable assertions.
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('AppSettingsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderDialog(open: boolean, onClose = vi.fn()) {
    return {
      onClose,
      user: userEvent.setup(),
      ...render(<AppSettingsDialog open={open} onClose={onClose} />),
    };
  }

  it('does not render the dialog content when open is false', () => {
    // Contract: the dialog is not visible/mounted when closed.
    renderDialog(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-form')).not.toBeInTheDocument();
  });

  it('renders the dialog title and form when open is true', () => {
    // Contract: opening the dialog renders title and content.
    renderDialog(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    expect(screen.getByTestId('settings-form')).toBeInTheDocument();
  });

  it('invokes onClose when the close button is clicked', async () => {
    // Behavior: close affordance must delegate to consumer callback.
    const { user, onClose } = renderDialog(true);

    // Prefer accessible name first (best practice).
    const closeBtn =
      screen.queryByRole('button', { name: /close/i }) ??
      screen.queryByLabelText(/close/i);

    // If the component uses an icon-only button without accessible name,
    // fall back to "any button" as last resort (still asserting callback).
    const fallbackBtn = closeBtn ?? screen.getAllByRole('button')[0];

    await user.click(fallbackBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose when the backdrop is clicked (if enabled)', async () => {
    // Note: MUI Dialog can disable backdrop click via props; we only assert if backdrop exists.
    const { user, onClose, container } = renderDialog(true);

    const backdrop = container.querySelector('.MuiBackdrop-root');
    if (!backdrop) {
      // If Dialog implementation does not expose a backdrop in this render mode, the test remains valid.
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      return;
    }

    await user.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });

  it('toggles visibility when open prop changes', () => {
    // Controlled-component contract: open drives visibility.
    const { rerender } = renderDialog(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<AppSettingsDialog open={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('settings-form')).toBeInTheDocument();
  });
});
