/**
 * @file LanguageToggle.test.tsx
 * @module __tests__/app/HamburgerMenu/LanguageRegionSettings/LanguageToggle
 * @description Tests for language toggle component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageToggle from '../../../../app/HamburgerMenu/LanguageRegionSettings/LanguageToggle';

// Hoisted mocks
const mockChangeLanguage = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('LanguageToggle', () => {
  const mockOnLocaleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: mockChangeLanguage },
    });
  });

  it('renders language toggle component', () => {
    render(<LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />);
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('renders Deutsch button', () => {
    render(<LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />);
    expect(screen.getByRole('button', { name: /deutsch/i })).toBeInTheDocument();
  });

  it('renders English button', () => {
    render(<LanguageToggle locale="de" onLocaleChange={mockOnLocaleChange} />);
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument();
  });

  it('calls onLocaleChange with "de" when Deutsch clicked', async () => {
    const user = userEvent.setup();
    render(<LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />);

    await user.click(screen.getByRole('button', { name: /deutsch/i }));

    expect(mockOnLocaleChange).toHaveBeenCalledWith('de');
  });

  it('calls onLocaleChange with "en" when English clicked', async () => {
    const user = userEvent.setup();
    render(<LanguageToggle locale="de" onLocaleChange={mockOnLocaleChange} />);

    await user.click(screen.getByRole('button', { name: /english/i }));

    expect(mockOnLocaleChange).toHaveBeenCalledWith('en');
  });

  it('calls i18n.changeLanguage when language selected', async () => {
    const user = userEvent.setup();
    render(<LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />);

    await user.click(screen.getByRole('button', { name: /deutsch/i }));

    expect(mockChangeLanguage).toHaveBeenCalledWith('de');
  });

  it('selects German when locale is "de"', () => {
    render(<LanguageToggle locale="de" onLocaleChange={mockOnLocaleChange} />);
    const button = screen.getByRole('button', { name: /deutsch/i });
    expect(button).toHaveClass('Mui-selected');
  });

  it('selects English when locale is "en"', () => {
    render(<LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />);
    const button = screen.getByRole('button', { name: /english/i });
    expect(button).toHaveClass('Mui-selected');
  });

  it('uses translation for label', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'language.language') return 'Sprache';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: mockChangeLanguage },
    });

    render(<LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />);
    expect(screen.getByText('Sprache')).toBeInTheDocument();
  });

  it('renders flag icons for both languages', () => {
    const { container } = render(
      <LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />
    );
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('alt', 'Deutsch');
    expect(images[1]).toHaveAttribute('alt', 'English');
  });

  it('does not change language when clicking selected option', async () => {
    const user = userEvent.setup();
    render(<LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />);

    // Click the already selected English button
    await user.click(screen.getByRole('button', { name: /english/i }));

    // Callback should not be triggered for already selected value
    expect(mockOnLocaleChange).not.toHaveBeenCalled();
  });

  it('allows switching between languages', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />
    );

    await user.click(screen.getByRole('button', { name: /deutsch/i }));
    expect(mockOnLocaleChange).toHaveBeenCalledWith('de');

    rerender(<LanguageToggle locale="de" onLocaleChange={mockOnLocaleChange} />);

    await user.click(screen.getByRole('button', { name: /english/i }));
    expect(mockOnLocaleChange).toHaveBeenCalledWith('en');
  });
});
