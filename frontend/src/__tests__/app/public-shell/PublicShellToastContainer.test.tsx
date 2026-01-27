/**
 * @file PublicShellToastContainer.test.tsx
 * @module __tests__/app/public-shell/PublicShellToastContainer
 * @description
 * Tests for PublicShellToastContainer.
 *
 * Scope:
 * - Renders a toast message via MUI Snackbar + Alert when toast.open=true
 * - Displays the correct severity styling for success/info/warning/error
 * - Delegates close interaction to onClose callback
 *
 * Out of scope:
 * - Snackbar animation timing / auto-hide behavior (MUI internal)
 * - Precise anchorOrigin positioning (MUI internal)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicShellToastContainer from '../../../app/public-shell/PublicShellToastContainer';

type Severity = 'success' | 'info' | 'warning' | 'error';
type Toast = { open: boolean; msg: string; severity: Severity };

describe('PublicShellToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderToast(toast: Toast, onClose: () => void = vi.fn()) {
    return render(<PublicShellToastContainer toast={toast} onClose={onClose} />);
  }

  it('renders Snackbar/Alert content when toast is open', () => {
    // Primary contract: open toast must be visible and show its message.
    const toast: Toast = { open: true, msg: 'Test message', severity: 'success' };

    const { container } = renderToast(toast);

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(container.querySelector('.MuiSnackbar-root')).toBeInTheDocument();
    expect(container.querySelector('.MuiAlert-root')).toBeInTheDocument();
  });

  it('updates the displayed message when toast props change', () => {
    // Regression guard: UI should reflect the latest toast state.
    const { rerender } = renderToast({ open: true, msg: 'First', severity: 'info' });

    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(
      <PublicShellToastContainer
        toast={{ open: true, msg: 'Second', severity: 'warning' }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });

  describe('Severity styling', () => {
    const cases: Array<{ severity: Severity; expectedClassFragment: string }> = [
      { severity: 'success', expectedClassFragment: 'filledSuccess' },
      { severity: 'info', expectedClassFragment: 'filledInfo' },
      { severity: 'warning', expectedClassFragment: 'filledWarning' },
      { severity: 'error', expectedClassFragment: 'filledError' },
    ];

    cases.forEach(({ severity, expectedClassFragment }) => {
      it(`renders "${severity}" severity with corresponding filled styling`, () => {
        // Visual contract: Alert variant is "filled" and reflects severity in its classes.
        const { container } = renderToast({ open: true, msg: 'Msg', severity });

        const alert = container.querySelector('.MuiAlert-root');
        expect(alert).toBeInTheDocument();
        expect(alert?.className).toContain(expectedClassFragment);

        // Ensure we are using the filled variant (component-level styling contract).
        expect(container.querySelector('.MuiAlert-filled')).toBeInTheDocument();
      });
    });
  });

  it('calls onClose when the user clicks the close action (when present)', async () => {
    // Interaction contract: closing the toast delegates to the provided callback.
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = renderToast({ open: true, msg: 'Closable', severity: 'success' }, onClose);

    // MUI Alert renders an action button when close handler is wired by the component.
    const closeButton = container.querySelector('.MuiAlert-action button');

    // If the component renders a close action, it must call onClose.
    // If it doesn't render one, this test would be flaky; so we assert existence first.
    expect(closeButton).toBeTruthy();

    await user.click(closeButton as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
