/**
 * @file LanguageToggle.test.tsx
 * @module __tests__/app/HamburgerMenu/LanguageRegionSettings
 *
 * @description
 * Unit tests for <LanguageToggle /> — language switcher between German and English.
 *
 * Test strategy:
 * - Verify label and both language options render.
 * - Verify interaction calls:
 *   - `onLocaleChange` (parent state update)
 *   - `i18n.changeLanguage` (runtime i18n update)
 * - Verify selection state reflects the `locale` prop (controlled component).
 * - Verify UX guard: clicking the already-selected option is a no-op.
 * - Verify icons exist (light regression guard).
 *
 * Notes:
 * - We assert MUI "Mui-selected" because selection is the core behavior of a toggle group.
 * - i18n is mocked to avoid coupling tests to translation catalogs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageToggle from '../../../../app/HamburgerMenu/LanguageRegionSettings/LanguageToggle';

// -----------------------------------------------------------------------------
// i18n mocks
// -----------------------------------------------------------------------------
const mockChangeLanguage = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Locale = 'en' | 'de';

describe('LanguageToggle', () => {
  const mockOnLocaleChange = vi.fn();

  /**
   * Arrange helper:
   * Centralizes rendering and makes scenario changes explicit via locale.
   */
  const arrange = (locale: Locale) =>
    render(<LanguageToggle locale={locale} onLocaleChange={mockOnLocaleChange} />);

  /**
   * Query helpers:
   * Use accessible names because these are user-facing controls.
   */
  const getGermanButton = () => screen.getByRole('button', { name: /deutsch/i });
  const getEnglishButton = () => screen.getByRole('button', { name: /english/i });

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLocaleChange.mockReset();

    // Default deterministic i18n stub.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: mockChangeLanguage },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: label + options
  // ---------------------------------------------------------------------------
  it('renders the language section label', () => {
    arrange('en');
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('renders both language options', () => {
    arrange('en');
    expect(getGermanButton()).toBeInTheDocument();
    expect(getEnglishButton()).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Interaction: parent callback + i18n integration
  // ---------------------------------------------------------------------------
  it('calls onLocaleChange with "de" when Deutsch is clicked', async () => {
    const user = userEvent.setup();
    arrange('en');

    await user.click(getGermanButton());
    expect(mockOnLocaleChange).toHaveBeenCalledWith('de');
  });

  it('calls onLocaleChange with "en" when English is clicked', async () => {
    const user = userEvent.setup();
    arrange('de');

    await user.click(getEnglishButton());
    expect(mockOnLocaleChange).toHaveBeenCalledWith('en');
  });

  it('calls i18n.changeLanguage when a language is selected', async () => {
    const user = userEvent.setup();
    arrange('en');

    await user.click(getGermanButton());
    expect(mockChangeLanguage).toHaveBeenCalledWith('de');
  });

  it('does not change language when clicking the already selected option', async () => {
    const user = userEvent.setup();
    arrange('en');

    // UX guard: clicking the active option should be a no-op.
    await user.click(getEnglishButton());
    expect(mockOnLocaleChange).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Selection state
  // ---------------------------------------------------------------------------
  it('marks German as selected when locale is "de"', () => {
    arrange('de');
    expect(getGermanButton()).toHaveClass('Mui-selected');
  });

  it('marks English as selected when locale is "en"', () => {
    arrange('en');
    expect(getEnglishButton()).toHaveClass('Mui-selected');
  });

  // ---------------------------------------------------------------------------
  // i18n wiring: label translation
  // ---------------------------------------------------------------------------
  it('renders a translated label when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'language.language') return 'Sprache';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: mockChangeLanguage },
    });

    arrange('en');

    // User-visible outcome
    expect(screen.getByText('Sprache')).toBeInTheDocument();

    // Integration: correct key used
    expect(mockT).toHaveBeenCalledWith('language.language', 'Language');
  });

  // ---------------------------------------------------------------------------
  // Regression: flag icons
  // ---------------------------------------------------------------------------
  it('renders flag icons for both languages', () => {
    // Implementation-level assertion (img elements), kept intentionally lightweight.
    const { container } = arrange('en');

    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);

    // Alt text is important for accessibility (and doubles as a stable test anchor).
    expect(images[0]).toHaveAttribute('alt', 'Deutsch');
    expect(images[1]).toHaveAttribute('alt', 'English');
  });

  // ---------------------------------------------------------------------------
  // Regression: switching flow (controlled component usage)
  // ---------------------------------------------------------------------------
  it('allows switching between languages', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <LanguageToggle locale="en" onLocaleChange={mockOnLocaleChange} />,
    );

    await user.click(getGermanButton());
    expect(mockOnLocaleChange).toHaveBeenCalledWith('de');

    // Simulate parent update
    rerender(<LanguageToggle locale="de" onLocaleChange={mockOnLocaleChange} />);

    await user.click(getEnglishButton());
    expect(mockOnLocaleChange).toHaveBeenCalledWith('en');
  });
});
