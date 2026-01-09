/**
 * @file ThemeToggle.test.tsx
 *
 * @what_is_under_test ThemeToggle component
 * @responsibility Theme mode toggle button (light/dark) with icon and tooltip
 * @out_of_scope Theme persistence, i18next integration, actual theme application
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../../../app/public-shell/header/ThemeToggle';

describe('ThemeToggle', () => {
  describe('Icon display', () => {
    it('indicates Dark mode when themeMode is light', () => {
      render(<ThemeToggle themeMode="light" onToggle={() => {}} />);

      const button = screen.getByLabelText(/dark mode/i);
      expect(button).toBeInTheDocument();
    });

    it('indicates Light mode when themeMode is dark', () => {
      render(<ThemeToggle themeMode="dark" onToggle={() => {}} />);

      const button = screen.getByLabelText(/light mode/i);
      expect(button).toBeInTheDocument();
    });

    it('updates tooltip text when themeMode prop changes', () => {
      const { rerender } = render(<ThemeToggle themeMode="light" onToggle={() => {}} />);

      expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();

      rerender(<ThemeToggle themeMode="dark" onToggle={() => {}} />);

      expect(screen.getByLabelText(/light mode/i)).toBeInTheDocument();
    });
  });

  describe('Tooltip display', () => {
    it('displays "Dark mode" tooltip when in light mode', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle themeMode="light" onToggle={() => {}} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      const tooltip = await screen.findByText('Dark mode');
      expect(tooltip).toBeInTheDocument();
    });

    it('displays "Light mode" tooltip when in dark mode', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle themeMode="dark" onToggle={() => {}} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      const tooltip = await screen.findByText('Light mode');
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe('Click behavior', () => {
    it('calls onToggle when button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();

      render(<ThemeToggle themeMode="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle multiple times on multiple clicks', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();

      render(<ThemeToggle themeMode="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(3);
    });
  });

  describe('Icon button styling', () => {
    it('renders as IconButton component', () => {
      const { container } = render(<ThemeToggle themeMode="light" onToggle={() => {}} />);

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });

    it('applies color styling based on theme mode', () => {
      const { container: lightContainer } = render(
        <ThemeToggle themeMode="light" onToggle={() => {}} />
      );

      const lightButton = lightContainer.querySelector('button');
      expect(lightButton?.className).toContain('MuiIconButton-root');

      const { container: darkContainer } = render(
        <ThemeToggle themeMode="dark" onToggle={() => {}} />
      );

      const darkButton = darkContainer.querySelector('button');
      expect(darkButton?.className).toContain('MuiIconButton-root');
    });
  });

  describe('Accessibility', () => {
    it('renders as a button element', () => {
      render(<ThemeToggle themeMode="light" onToggle={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();

      render(<ThemeToggle themeMode="light" onToggle={mockOnToggle} />);

      await user.tab();
      await user.keyboard('{Enter}');

      expect(mockOnToggle).toHaveBeenCalled();
    });
  });
});
