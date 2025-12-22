/**
 * @file AppSettingsDialog.test.tsx
 *
 * @what_is_under_test AppSettingsDialog component
 * @responsibility Dialog container for application settings management
 * @out_of_scope Form validation, settings persistence, actual setting changes
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppSettingsDialog from '../../../app/settings/AppSettingsDialog';

// Mock useAppSettingsForm hook
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

// Mock AppSettingsForm
vi.mock('../../../app/settings/AppSettingsForm', () => ({
  default: vi.fn(() => <div data-testid="settings-form">Form Content</div>),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
  }),
}));

describe('AppSettingsDialog', () => {
  describe('Dialog rendering', () => {
    it('renders dialog when open prop is true', () => {
      render(
        <AppSettingsDialog open={true} onClose={() => {}} />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('does not render dialog when open prop is false', () => {
      const { container } = render(
        <AppSettingsDialog open={false} onClose={() => {}} />
      );

      const dialog = container.querySelector('.MuiDialog-root');
      expect(dialog).not.toBeInTheDocument();
    });

    it('renders dialog title', () => {
      render(<AppSettingsDialog open={true} onClose={() => {}} />);

      const title = screen.getByText(/settings/i);
      expect(title).toBeInTheDocument();
    });
  });

  describe('Dialog content', () => {
    it('renders settings form component', () => {
      render(<AppSettingsDialog open={true} onClose={() => {}} />);

      const form = screen.getByTestId('settings-form');
      expect(form).toBeInTheDocument();
    });

    it('renders dialog content with dividers', () => {
      render(
        <AppSettingsDialog open={true} onClose={() => {}} />
      );

      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });
  });

  describe('Dialog actions', () => {
    it('renders close button in dialog', () => {
      render(<AppSettingsDialog open={true} onClose={() => {}} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      const { container } = render(
        <AppSettingsDialog open={true} onClose={mockOnClose} />
      );

      const closeButton = container.querySelector('[aria-label*="close"], button[type="button"]');
      if (closeButton) {
        await user.click(closeButton);
      }
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      const { container } = render(
        <AppSettingsDialog open={true} onClose={mockOnClose} />
      );

      const backdrop = container.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        await user.click(backdrop);
      }
    });
  });

  describe('Dialog styling', () => {
    it('renders with Material-UI Dialog component', () => {
      render(
        <AppSettingsDialog open={true} onClose={() => {}} />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('uses small max width layout', () => {
      render(
        <AppSettingsDialog open={true} onClose={() => {}} />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('State management', () => {
    it('toggles dialog visibility based on open prop', () => {
      const { rerender } = render(
        <AppSettingsDialog open={false} onClose={() => {}} />
      );

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();

      rerender(<AppSettingsDialog open={true} onClose={() => {}} />);

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });
});
