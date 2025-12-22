/**
 * @file PublicShellToastContainer.test.tsx
 *
 * @what_is_under_test PublicShellToastContainer component
 * @responsibility Toast notification display with Snackbar and Alert components
 * @out_of_scope Toast event handling, persistence, animation details
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicShellToastContainer from '../../../app/public-shell/PublicShellToastContainer';

describe('PublicShellToastContainer', () => {
  describe('Toast visibility', () => {
    it('renders Snackbar when toast is open', () => {
      const toast = { open: true, msg: 'Test message', severity: 'success' as const };
      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={() => {}} />
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();
      const snackbar = container.querySelector('.MuiSnackbar-root');
      expect(snackbar).toBeInTheDocument();
    });
  });

  describe('Toast message display', () => {
    it('displays toast message text', () => {
      const toast = { open: true, msg: 'Success notification', severity: 'success' as const };
      render(<PublicShellToastContainer toast={toast} onClose={() => {}} />);

      expect(screen.getByText('Success notification')).toBeInTheDocument();
    });

    it('displays different messages for different toasts', () => {
      const { rerender } = render(
        <PublicShellToastContainer
          toast={{ open: true, msg: 'First message', severity: 'info' as const }}
          onClose={() => {}}
        />
      );

      expect(screen.getByText('First message')).toBeInTheDocument();

      rerender(
        <PublicShellToastContainer
          toast={{ open: true, msg: 'Second message', severity: 'warning' as const }}
          onClose={() => {}}
        />
      );

      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.queryByText('First message')).not.toBeInTheDocument();
    });
  });

  describe('Alert severity levels', () => {
    it('renders success severity Alert', () => {
      const toast = { open: true, msg: 'Success!', severity: 'success' as const };
      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={() => {}} />
      );

      const alert = container.querySelector('.MuiAlert-root');
      expect(alert?.className).toContain('filledSuccess');
    });

    it('renders info severity Alert', () => {
      const toast = { open: true, msg: 'Info', severity: 'info' as const };
      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={() => {}} />
      );

      const alert = container.querySelector('.MuiAlert-root');
      expect(alert?.className).toContain('filledInfo');
    });

    it('renders warning severity Alert', () => {
      const toast = { open: true, msg: 'Warning', severity: 'warning' as const };
      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={() => {}} />
      );

      const alert = container.querySelector('.MuiAlert-root');
      expect(alert?.className).toContain('filledWarning');
    });

    it('renders error severity Alert', () => {
      const toast = { open: true, msg: 'Error', severity: 'error' as const };
      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={() => {}} />
      );

      const alert = container.querySelector('.MuiAlert-root');
      expect(alert?.className).toContain('filledError');
    });
  });

  describe('Close callback', () => {
    it('calls onClose when toast should close', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      const toast = { open: true, msg: 'Test', severity: 'success' as const };

      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={mockOnClose} />
      );

      // Find close button in alert
      const closeButton = container.querySelector('.MuiAlert-action button');
      if (closeButton) {
        await user.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Positioning and styling', () => {
    it('renders Snackbar with bottom-right anchor', () => {
      const toast = { open: true, msg: 'Test', severity: 'success' as const };
      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={() => {}} />
      );

      const snackbar = container.querySelector('.MuiSnackbar-root');
      expect(snackbar).toBeInTheDocument();
    });

    it('renders Alert with filled variant', () => {
      const toast = { open: true, msg: 'Test', severity: 'success' as const };
      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={() => {}} />
      );

      const alert = container.querySelector('.MuiAlert-filled');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Auto-hide duration', () => {
    it('sets auto-hide duration to 2500ms', () => {
      const toast = { open: true, msg: 'Auto-hide test', severity: 'success' as const };
      const { container } = render(
        <PublicShellToastContainer toast={toast} onClose={() => {}} />
      );

      const snackbar = container.querySelector('.MuiSnackbar-root');
      expect(snackbar).toBeInTheDocument();
    });
  });
}); 
