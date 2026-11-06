/**
 * @file AppSettingsDialog.test.tsx
 * @module __tests__/app/settings/AppSettingsDialog
 * @description
 * Tests for AppSettingsDialog.
 *
 * Scope:
 * - Renders a settings dialog container when open
 * - Wires close interactions (close button / backdrop) to onClose callback
 * - Hosts the AppSettingsForm and feeds it language and theme from useShellSettings
 *
 * Out of scope:
 * - Form validation and persistence
 * - Settings mutation logic (covered by hook/form tests)
 * - Material-UI internal behavior (we assert only the contracts we rely on)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppSettingsDialog from '@/app/settings/AppSettingsDialog';
import { tEn } from '@/__tests__/test/i18nEn';

// Hook is mocked because this file only validates the dialog container behavior.
vi.mock('@/app/settings/hooks/useAppSettingsForm', () => ({
  useAppSettingsForm: () => ({
    formState: {
      dateFormat: 'DD.MM.YYYY',
      numberFormat: 'de-DE',
      tableDensity: 'comfortable',
    },
    systemInfo: {
      database: 'Oracle',
      environment: 'production',
      status: 'healthy',
    },
    isLoading: false,
    handleDateFormatChange: vi.fn(),
    handleNumberFormatChange: vi.fn(),
    handleTableDensityChange: vi.fn(),
    handleResetDefaults: vi.fn(),
  }),
}));

const shellSettings = vi.hoisted(() => ({
  locale: 'en' as const,
  themeMode: 'dark' as const,
  handleThemeModeChange: vi.fn(),
  handleLocaleChange: vi.fn(),
}));

// Language and theme are shell-wide; the dialog reads them from useShellSettings.
vi.mock('@/app/layout/useShellSettings', () => ({
  useShellSettings: () => shellSettings,
}));

let lastFormProps: Record<string, unknown> | undefined;

vi.mock('@/app/settings/AppSettingsForm', () => ({
  default: (props: Record<string, unknown>) => {
    lastFormProps = props;
    return <div data-testid="settings-form">Form Content</div>;
  },
}));

// Stubbed because HelpIconButton requires HelpProvider; the real component
// is covered by its own suite (features/help/components/HelpIconButton.test.tsx).
vi.mock('@/features/help/components/HelpIconButton', () => ({
  HelpIconButton: ({ topicId }: { topicId: string }) => (
    <button data-testid="help-icon-button" data-topic-id={topicId} />
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // tEn resolves keys against the real English locale files.
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
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

  it('passes language and theme from useShellSettings to the form', () => {
    renderDialog(true);

    expect(lastFormProps).toMatchObject({
      locale: 'en',
      onLocaleChange: shellSettings.handleLocaleChange,
      themeMode: 'dark',
      onThemeModeChange: shellSettings.handleThemeModeChange,
    });
  });

  it('renders the help button wired to the settings help topic', () => {
    // Contract: the title bar exposes contextual help for the settings topic.
    renderDialog(true);

    expect(screen.getByTestId('help-icon-button')).toHaveAttribute(
      'data-topic-id',
      'settings.preferences',
    );
  });

  it('invokes onClose when the close button is clicked', async () => {
    const { user, onClose } = renderDialog(true);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose when the backdrop is clicked', async () => {
    const { user, onClose } = renderDialog(true);

    // MUI renders the dialog in a portal under document.body, outside the render container
    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
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
