/**
 * @file LanguageToggle.test.tsx
 *
 * @what_is_under_test LanguageToggle component
 * @responsibility Language toggle button with flag icon for DE/EN
 * @out_of_scope i18next integration, toast notifications, language persistence
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageToggle from '../../../../app/public-shell/header/LanguageToggle';

// Mock flag images
vi.mock('/flags/de.svg', () => ({ default: 'de-flag.svg' }));
vi.mock('/flags/us.svg', () => ({ default: 'us-flag.svg' }));

describe('LanguageToggle', () => {
  describe('Flag icon display', () => {
    it('renders German flag when locale is de', () => {
      render(
        <LanguageToggle locale="de" onToggle={() => {}} tooltip="Toggle language" />
      );

      const img = screen.getByAltText('Deutsch');
      expect(img).toBeInTheDocument();
    });

    it('renders US flag when locale is en', () => {
      render(
        <LanguageToggle locale="en" onToggle={() => {}} tooltip="Toggle language" />
      );

      const img = screen.getByAltText('English');
      expect(img).toBeInTheDocument();
    });

    it('switches flag when locale prop changes', () => {
      const { rerender } = render(
        <LanguageToggle locale="de" onToggle={() => {}} tooltip="Toggle language" />
      );

      expect(screen.getByAltText('Deutsch')).toBeInTheDocument();

      rerender(
        <LanguageToggle locale="en" onToggle={() => {}} tooltip="Toggle language" />
      );

      expect(screen.getByAltText('English')).toBeInTheDocument();
    });
  });

  describe('Tooltip display', () => {
    it('displays provided tooltip text', async () => {
      const user = userEvent.setup();
      render(
        <LanguageToggle
          locale="de"
          onToggle={() => {}}
          tooltip="Change to English"
        />
      );

      const button = screen.getByRole('button');
      await user.hover(button);

      const tooltip = await screen.findByText('Change to English');
      expect(tooltip).toBeInTheDocument();
    });

    it('displays different tooltips', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <LanguageToggle
          locale="de"
          onToggle={() => {}}
          tooltip="Switch to English"
        />
      );

      let button = screen.getByRole('button');
      await user.hover(button);
      expect(await screen.findByText('Switch to English')).toBeInTheDocument();

      rerender(
        <LanguageToggle
          locale="en"
          onToggle={() => {}}
          tooltip="Switch to Deutsch"
        />
      );

      button = screen.getByRole('button');
      await user.unhover(button);
      await user.hover(button);
      expect(await screen.findByText('Switch to Deutsch')).toBeInTheDocument();
    });
  });

  describe('Click behavior', () => {
    it('calls onToggle when button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();

      render(
        <LanguageToggle locale="de" onToggle={mockOnToggle} tooltip="Toggle" />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle on multiple clicks', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();

      render(
        <LanguageToggle locale="de" onToggle={mockOnToggle} tooltip="Toggle" />
      );

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('Icon sizing', () => {
    it('renders flag image with 20x20 pixel size', () => {
      render(
        <LanguageToggle locale="de" onToggle={() => {}} tooltip="Toggle" />
      );

      const img = screen.getByAltText('Deutsch') as HTMLImageElement;
      expect(img.width).toBe(20);
      expect(img.height).toBe(20);
    });
  });

  describe('Button styling', () => {
    it('renders as IconButton component', () => {
      const { container } = render(
        <LanguageToggle locale="de" onToggle={() => {}} tooltip="Toggle" />
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders as a button element', () => {
      render(
        <LanguageToggle locale="de" onToggle={() => {}} tooltip="Toggle language" />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('flag has appropriate alt text', () => {
      const { rerender } = render(
        <LanguageToggle locale="de" onToggle={() => {}} tooltip="Toggle" />
      );

      expect(screen.getByAltText('Deutsch')).toBeInTheDocument();

      rerender(
        <LanguageToggle locale="en" onToggle={() => {}} tooltip="Toggle" />
      );

      expect(screen.getByAltText('English')).toBeInTheDocument();
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();

      render(
        <LanguageToggle locale="de" onToggle={mockOnToggle} tooltip="Toggle" />
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnToggle).toHaveBeenCalled();
    });
  });
});
