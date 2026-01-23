/**
 * @file NumberFormatSetting.test.tsx
 * @module __tests__/app/HamburgerMenu/LanguageRegionSettings
 *
 * @description
 * Unit tests for <NumberFormatSetting /> — lets the user choose a preferred number format.
 *
 * Supported formats:
 * - "DE"     => 1.234,56
 * - "EN_US"  => 1,234.56
 *
 * Test strategy:
 * - Verify the label and both radio options render.
 * - Verify selection state reflects the provided prop (controlled component).
 * - Verify interaction: selecting an option calls onChange with the correct format id.
 * - Verify i18n wiring by mocking translations for the label.
 *
 * Notes:
 * - We interact with radios via accessible names that include the example number patterns.
 * - If the component prop is strictly typed to "DE" | "EN_US", remove the invalid-value test
 *   or move that validation to the settings parsing layer.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NumberFormatSetting from '../../../../app/HamburgerMenu/LanguageRegionSettings/NumberFormatSetting';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type NumberFormat = 'DE' | 'EN_US' | string;

describe('NumberFormatSetting', () => {
  const mockOnChange = vi.fn();

  /**
   * Arrange helper: render with a given number format.
   */
  const arrange = (numberFormat: NumberFormat) =>
    render(<NumberFormatSetting numberFormat={numberFormat} onChange={mockOnChange} />);

  /**
   * Query helpers: radios are located by their visible example formatting.
   */
  const getGermanRadio = () => screen.getByRole('radio', { name: /1\.234,56/i });
  const getUsRadio = () => screen.getByRole('radio', { name: /1,234\.56/i });

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange.mockReset();

    // Deterministic translation stub: return defaultValue for stable assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: label + options
  // ---------------------------------------------------------------------------
  it('renders the number format label', () => {
    arrange('DE');
    expect(screen.getByText('Number Format')).toBeInTheDocument();
  });

  it('renders both number format options', () => {
    arrange('DE');
    expect(getGermanRadio()).toBeInTheDocument();
    expect(getUsRadio()).toBeInTheDocument();
  });

  it('renders a radio group with exactly two options', () => {
    arrange('DE');
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // Selection state (controlled component behavior)
  // ---------------------------------------------------------------------------
  it('marks German format as checked when selected', () => {
    arrange('DE');
    expect(getGermanRadio()).toBeChecked();
  });

  it('marks US format as checked when selected', () => {
    arrange('EN_US');
    expect(getUsRadio()).toBeChecked();
  });

  it('falls back to DE for invalid format values', () => {
    // Defensive behavior: avoids undefined UI state when persisted settings are invalid.
    arrange('invalid');
    expect(getGermanRadio()).toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Interaction: calls onChange
  // ---------------------------------------------------------------------------
  it('calls onChange with "DE" when the German option is selected', async () => {
    const user = userEvent.setup();
    arrange('EN_US');

    await user.click(getGermanRadio());
    expect(mockOnChange).toHaveBeenCalledWith('DE');
  });

  it('calls onChange with "EN_US" when the US option is selected', async () => {
    const user = userEvent.setup();
    arrange('DE');

    await user.click(getUsRadio());
    expect(mockOnChange).toHaveBeenCalledWith('EN_US');
  });

  it('allows switching between formats (controlled update)', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <NumberFormatSetting numberFormat="DE" onChange={mockOnChange} />,
    );

    await user.click(getUsRadio());
    expect(mockOnChange).toHaveBeenCalledWith('EN_US');

    // Simulate parent update
    rerender(<NumberFormatSetting numberFormat="EN_US" onChange={mockOnChange} />);

    await user.click(getGermanRadio());
    expect(mockOnChange).toHaveBeenCalledWith('DE');
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders a translated label when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'language.numberFormat') return 'Zahlenformat';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange('DE');

    // User-visible outcome
    expect(screen.getByText('Zahlenformat')).toBeInTheDocument();

    // Integration: correct key used
    expect(mockT).toHaveBeenCalledWith('language.numberFormat', 'Number Format');
  });
});
