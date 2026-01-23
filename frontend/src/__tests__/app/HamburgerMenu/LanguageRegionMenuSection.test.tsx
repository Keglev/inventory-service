/**
 * @file LanguageRegionMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu
 *
 * @description
 * Unit tests for <LanguageRegionMenuSection /> — orchestrates language/region preferences:
 * - Locale switching via <LanguageToggle />
 * - Date format selection via <DateFormatSetting />
 * - Number format selection via <NumberFormatSetting />
 *
 * Test strategy:
 * - Keep child components mocked to focus on orchestration and prop wiring.
 * - Assert props passed into child components reflect current settings + parent props.
 * - Trigger child callbacks (onChange) and verify partial updates via setUserPreferences.
 * - Verify i18n title translation wiring.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LanguageRegionMenuSection from '../../../app/HamburgerMenu/LanguageRegionMenuSection';

// -----------------------------------------------------------------------------
// Minimal types needed for test wiring (keep aligned with component contracts)
// -----------------------------------------------------------------------------
type Locale = 'en' | 'de';
type DateFormat = 'DD.MM.YYYY' | 'YYYY-MM-DD';
type NumberFormat = 'DE' | 'EN_US';

type LanguageToggleProps = {
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
};

type DateFormatSettingProps = {
  dateFormat: DateFormat;
  onChange: (next: DateFormat) => void;
};

type NumberFormatSettingProps = {
  numberFormat: NumberFormat;
  onChange: (next: NumberFormat) => void;
};

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------
const mockSetUserPreferences = vi.hoisted(() => vi.fn());
const mockUseSettings = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Vitest generics are <ArgsTuple, ReturnType>, not <FunctionType>.
const mockLanguageToggle = vi.hoisted(() =>
  vi.fn<[LanguageToggleProps], React.ReactElement>(() => <div>Language Toggle</div>),
);

const mockDateFormatSetting = vi.hoisted(() =>
  vi.fn<[DateFormatSettingProps], React.ReactElement>(() => <div>Date Format</div>),
);

const mockNumberFormatSetting = vi.hoisted(() =>
  vi.fn<[NumberFormatSettingProps], React.ReactElement>(() => <div>Number Format</div>),
);

vi.mock('../../../hooks/useSettings', () => ({
  useSettings: mockUseSettings,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('../../../app/HamburgerMenu/LanguageRegionSettings', () => ({
  LanguageToggle: mockLanguageToggle,
  DateFormatSetting: mockDateFormatSetting,
  NumberFormatSetting: mockNumberFormatSetting,
}));

type Props = {
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
};

describe('LanguageRegionMenuSection', () => {
  // Keep this as a plain vi.fn() so it is callable as a function prop.
  // (Over-typing it with Vitest generics often creates signature mismatches.)
  const mockOnLocaleChange = vi.fn();

  const defaultProps: Props = {
    locale: 'en',
    onLocaleChange: mockOnLocaleChange as (next: Locale) => void,
  };

  /**
   * Helper: configure Settings hook return value (only override what matters for the test).
   */
  const setSettings = (prefs?: Partial<{ dateFormat: DateFormat; numberFormat: NumberFormat }>) => {
    mockUseSettings.mockReturnValue({
      userPreferences: {
        tableDensity: 'comfortable',
        dateFormat: prefs?.dateFormat ?? 'DD.MM.YYYY',
        numberFormat: prefs?.numberFormat ?? 'DE',
      },
      setUserPreferences: mockSetUserPreferences,
    });
  };

  /**
   * Arrange helper: render with defaults + optional overrides.
   */
  const arrange = (overrides?: Partial<Props>) =>
    render(<LanguageRegionMenuSection {...defaultProps} {...overrides} />);

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });

    setSettings();
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  it('renders section title', () => {
    arrange();
    expect(screen.getByText('Sprache & Region / Language & Region')).toBeInTheDocument();
  });

  it('renders all child settings components', () => {
    arrange();
    expect(screen.getByText('Language Toggle')).toBeInTheDocument();
    expect(screen.getByText('Date Format')).toBeInTheDocument();
    expect(screen.getByText('Number Format')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Prop wiring: LanguageToggle
  // ---------------------------------------------------------------------------
  it('passes locale and handler to LanguageToggle', () => {
    arrange();

    const lastProps = mockLanguageToggle.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(
      expect.objectContaining({
        locale: 'en',
        onLocaleChange: mockOnLocaleChange,
      }),
    );
  });

  it('passes German locale to LanguageToggle', () => {
    arrange({ locale: 'de' });

    const lastProps = mockLanguageToggle.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ locale: 'de' }));
  });

  // ---------------------------------------------------------------------------
  // Prop wiring: DateFormatSetting
  // ---------------------------------------------------------------------------
  it('passes dateFormat from settings to DateFormatSetting', () => {
    arrange();

    const lastProps = mockDateFormatSetting.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ dateFormat: 'DD.MM.YYYY' }));
  });

  it('passes ISO dateFormat from settings to DateFormatSetting', () => {
    setSettings({ dateFormat: 'YYYY-MM-DD' });
    arrange();

    const lastProps = mockDateFormatSetting.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ dateFormat: 'YYYY-MM-DD' }));
  });

  // ---------------------------------------------------------------------------
  // Prop wiring: NumberFormatSetting
  // ---------------------------------------------------------------------------
  it('passes numberFormat from settings to NumberFormatSetting', () => {
    arrange();

    const lastProps = mockNumberFormatSetting.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ numberFormat: 'DE' }));
  });

  it('passes US numberFormat from settings to NumberFormatSetting', () => {
    setSettings({ numberFormat: 'EN_US' });
    arrange();

    const lastProps = mockNumberFormatSetting.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ numberFormat: 'EN_US' }));
  });

  // ---------------------------------------------------------------------------
  // Behavior: preference updates via child callbacks
  // ---------------------------------------------------------------------------
  it('calls setUserPreferences when date format changes', () => {
    arrange();

    // Typed because the child mock uses tuple-arg typing.
    const lastProps = mockDateFormatSetting.mock.calls.at(-1)?.[0];
    expect(lastProps).toBeDefined();

    lastProps!.onChange('YYYY-MM-DD');

    expect(mockSetUserPreferences).toHaveBeenCalledWith({ dateFormat: 'YYYY-MM-DD' });
  });

  it('calls setUserPreferences when number format changes', () => {
    arrange();

    const lastProps = mockNumberFormatSetting.mock.calls.at(-1)?.[0];
    expect(lastProps).toBeDefined();

    lastProps!.onChange('EN_US');

    expect(mockSetUserPreferences).toHaveBeenCalledWith({ numberFormat: 'EN_US' });
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('uses translation for title when provided', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'language.title') return 'Langue et Région';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(screen.getByText('Langue et Région')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('language.title', 'Sprache & Region / Language & Region');
  });
});
