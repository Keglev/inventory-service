/**
 * @file DateFormatSetting.test.tsx
 * @module __tests__/app/HamburgerMenu/LanguageRegionSettings
 *
 * @description
 * Unit tests for <DateFormatSetting /> — lets the user choose a preferred date format.
 *
 * Supported formats:
 * - "DD.MM.YYYY" (common in DACH)
 * - "YYYY-MM-DD" (ISO-8601)
 *
 * Test strategy:
 * - Verify the label and both radio options render.
 * - Verify selection state reflects the provided prop (controlled component).
 * - Verify interaction: selecting an option calls onChange with the correct format.
 * - Verify defensive behavior: invalid values fall back to "DD.MM.YYYY".
 * - Verify i18n wiring by mocking translations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateFormatSetting from '../../../../app/HamburgerMenu/LanguageRegionSettings/DateFormatSetting';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type DateFormat = 'DD.MM.YYYY' | 'YYYY-MM-DD' | string;

describe('DateFormatSetting', () => {
  const mockOnChange = vi.fn();

  /**
   * Arrange helper: renders with a specific date format (controlled via props).
   */
  const arrange = (dateFormat: DateFormat) =>
    render(<DateFormatSetting dateFormat={dateFormat} onChange={mockOnChange} />);

  /**
   * Query helpers: radio inputs are interacted with by their accessible names.
   */
  const getDachFormatRadio = () =>
    screen.getByRole('radio', { name: /DD\.MM\.YYYY/i });

  const getIsoFormatRadio = () =>
    screen.getByRole('radio', { name: /YYYY-MM-DD/i });

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange.mockReset();

    // Deterministic translation stub: return defaultValue for stable text assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: label + options
  // ---------------------------------------------------------------------------
  it('renders the date format label', () => {
    arrange('DD.MM.YYYY');
    expect(screen.getByText('Date Format')).toBeInTheDocument();
  });

  it('renders both format options', () => {
    arrange('DD.MM.YYYY');
    expect(getDachFormatRadio()).toBeInTheDocument();
    expect(getIsoFormatRadio()).toBeInTheDocument();
  });

  it('renders a radio group with exactly two options', () => {
    arrange('DD.MM.YYYY');
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // Selection state (controlled component behavior)
  // ---------------------------------------------------------------------------
  it('marks DD.MM.YYYY as checked when selected', () => {
    arrange('DD.MM.YYYY');
    expect(getDachFormatRadio()).toBeChecked();
  });

  it('marks YYYY-MM-DD as checked when selected', () => {
    arrange('YYYY-MM-DD');
    expect(getIsoFormatRadio()).toBeChecked();
  });

  it('falls back to DD.MM.YYYY for invalid format values', () => {
    // Defensive behavior: avoids undefined UI state when input is unexpected/legacy.
    arrange('invalid');
    expect(getDachFormatRadio()).toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Interaction: calls onChange
  // ---------------------------------------------------------------------------
  it('calls onChange with "DD.MM.YYYY" when that option is selected', async () => {
    const user = userEvent.setup();
    arrange('YYYY-MM-DD');

    await user.click(getDachFormatRadio());
    expect(mockOnChange).toHaveBeenCalledWith('DD.MM.YYYY');
  });

  it('calls onChange with "YYYY-MM-DD" when that option is selected', async () => {
    const user = userEvent.setup();
    arrange('DD.MM.YYYY');

    await user.click(getIsoFormatRadio());
    expect(mockOnChange).toHaveBeenCalledWith('YYYY-MM-DD');
  });

  it('allows switching between formats (controlled update)', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <DateFormatSetting dateFormat="DD.MM.YYYY" onChange={mockOnChange} />,
    );

    await user.click(getIsoFormatRadio());
    expect(mockOnChange).toHaveBeenCalledWith('YYYY-MM-DD');

    // Simulate parent state update
    rerender(<DateFormatSetting dateFormat="YYYY-MM-DD" onChange={mockOnChange} />);

    await user.click(getDachFormatRadio());
    expect(mockOnChange).toHaveBeenCalledWith('DD.MM.YYYY');
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders a translated label when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'language.dateFormat') return 'Datumsformat';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange('DD.MM.YYYY');

    // User-visible result
    expect(screen.getByText('Datumsformat')).toBeInTheDocument();

    // Integration: correct key used
    expect(mockT).toHaveBeenCalledWith('language.dateFormat', 'Date Format');
  });
});
