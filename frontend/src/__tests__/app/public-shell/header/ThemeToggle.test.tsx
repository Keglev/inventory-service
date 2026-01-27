/**
 * @file ThemeToggle.test.tsx
 * @module __tests__/app/public-shell/header/ThemeToggle
 * @description
 * Tests for ThemeToggle.
 *
 * Scope:
 * - Indicates the next theme action via accessible label and tooltip ("Dark mode" / "Light mode")
 * - Delegates interactions to onToggle
 * - Preserves basic accessibility and expected MUI IconButton styling
 *
 * Out of scope:
 * - Theme persistence (localStorage, settings)
 * - Theme application (ThemeProvider / palette changes)
 * - i18n integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../../../app/public-shell/header/ThemeToggle';

type Props = React.ComponentProps<typeof ThemeToggle>;
type ThemeMode = 'light' | 'dark';

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderToggle(themeMode: ThemeMode, onToggle: Props['onToggle'] = vi.fn()) {
    return render(<ThemeToggle themeMode={themeMode} onToggle={onToggle} />);
  }

  describe('Accessible label contract', () => {
    it('indicates "Dark mode" action when themeMode=light', () => {
      // UX/accessibility contract: label describes the action (switch to dark).
      renderToggle('light');

      expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
    });

    it('indicates "Light mode" action when themeMode=dark', () => {
      // UX/accessibility contract: label describes the action (switch to light).
      renderToggle('dark');

      expect(screen.getByLabelText(/light mode/i)).toBeInTheDocument();
    });

    it('updates the label when themeMode prop changes', () => {
      // Guards against stale props in memoized components.
      const { rerender } = renderToggle('light');

      expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();

      rerender(<ThemeToggle themeMode="dark" onToggle={vi.fn()} />);

      expect(screen.getByLabelText(/light mode/i)).toBeInTheDocument();
    });
  });

  describe('Tooltip behavior', () => {
    it('shows "Dark mode" tooltip on hover when themeMode=light', async () => {
      // Tooltip should match the action described by the label.
      const user = userEvent.setup();
      renderToggle('light');

      await user.hover(screen.getByRole('button'));

      expect(await screen.findByText('Dark mode')).toBeInTheDocument();
    });

    it('shows "Light mode" tooltip on hover when themeMode=dark', async () => {
      const user = userEvent.setup();
      renderToggle('dark');

      await user.hover(screen.getByRole('button'));

      expect(await screen.findByText('Light mode')).toBeInTheDocument();
    });
  });

  describe('Interaction wiring', () => {
    it('calls onToggle when clicked', async () => {
      // Primary behavior: user click triggers the toggle callback.
      const user = userEvent.setup();
      const onToggle = vi.fn();

      renderToggle('light', onToggle);

      await user.click(screen.getByRole('button'));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle for each click (repeatable interaction)', async () => {
      // Ensures repeated interactions remain responsive.
      const user = userEvent.setup();
      const onToggle = vi.fn();

      renderToggle('light', onToggle);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onToggle).toHaveBeenCalledTimes(3);
    });

    it('is keyboard accessible (Enter triggers onToggle)', async () => {
      // Accessibility: keyboard activation should behave like click.
      const user = userEvent.setup();
      const onToggle = vi.fn();

      renderToggle('light', onToggle);

      await user.tab();
      await user.keyboard('{Enter}');

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling integration', () => {
    it('renders as an MUI IconButton (root class present)', () => {
      // Design contract: ThemeToggle uses IconButton for consistent header styling.
      const { container } = renderToggle('light');

      expect(container.querySelector('.MuiIconButton-root')).toBeInTheDocument();
    });
  });
});
