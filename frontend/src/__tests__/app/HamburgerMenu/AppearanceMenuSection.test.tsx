/**
 * @file AppearanceMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu
 *
 * @description
 * Unit tests for <AppearanceMenuSection /> — renders the appearance section within the hamburger menu
 * and wires user preference state (table density) through the Settings hook.
 *
 * Test strategy:
 * - Render verification: section title + child settings components appear.
 * - Prop wiring verification:
 *   - ThemeToggle receives themeMode + callback.
 *   - TableDensitySetting receives current density + onChange handler.
 * - Behavior verification:
 *   - Changing density triggers setUserPreferences with the correct partial update.
 * - i18n wiring verification: title translation is used when provided.
 *
 * Notes:
 * - Child components are mocked to isolate this "orchestrator" component.
 * - We avoid brittle assertions on React's second argument to function components.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppearanceMenuSection from '../../../app/HamburgerMenu/AppearanceMenuSection';

// -----------------------------------------------------------------------------
// Minimal types needed for wiring assertions
// -----------------------------------------------------------------------------
type ThemeMode = 'light' | 'dark';
type TableDensity = 'comfortable' | 'compact';
type Locale = 'en' | 'de';

type ThemeToggleProps = {
  themeMode: ThemeMode;
  onThemeModeChange: () => void;
};

type TableDensitySettingProps = {
  tableDensity: TableDensity;
  onChange: (next: TableDensity) => void;
};

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------
const mockSetUserPreferences = vi.hoisted(() => vi.fn());
const mockUseSettings = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Child components are mocked to isolate the unit under test.
// IMPORTANT: Vitest generics are <ArgsTuple, ReturnType>, not <FunctionType>
const mockThemeToggle = vi.hoisted(() =>
  vi.fn<[ThemeToggleProps], React.ReactElement>(() => <div>Theme Toggle</div>),
);

const mockTableDensitySetting = vi.hoisted(() =>
  vi.fn<[TableDensitySettingProps], React.ReactElement>(() => <div>Density Setting</div>),
);

vi.mock('../../../hooks/useSettings', () => ({
  useSettings: mockUseSettings,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('../../../app/HamburgerMenu/AppearanceSettings', () => ({
  ThemeToggle: mockThemeToggle,
  TableDensitySetting: mockTableDensitySetting,
}));

type Props = {
  themeMode: ThemeMode;
  onThemeModeChange: () => void;
};

describe('AppearanceMenuSection', () => {
  const mockOnThemeModeChange = vi.fn();

  const defaultProps: Props = {
    themeMode: 'light',
    onThemeModeChange: mockOnThemeModeChange,
  };

  /**
   * Helper: configure Settings hook return value.
   */
  const setSettings = (tableDensity: TableDensity) => {
    mockUseSettings.mockReturnValue({
      userPreferences: {
        tableDensity,
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'DE',
      },
      setUserPreferences: mockSetUserPreferences,
    });
  };

  /**
   * Arrange helper: render with defaults + optional prop overrides.
   */
  const arrange = (overrides?: Partial<Props>) =>
    render(<AppearanceMenuSection {...defaultProps} {...overrides} />);

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn(), language: 'en' as Locale },
    });

    setSettings('comfortable');
  });

  // ---------------------------------------------------------------------------
  // Rendering: title + children
  // ---------------------------------------------------------------------------
  it('renders the appearance section title', () => {
    arrange();
    expect(screen.getByText('Erscheinungsbild / Appearance')).toBeInTheDocument();
  });

  it('renders ThemeToggle and TableDensitySetting', () => {
    arrange();
    expect(screen.getByText('Theme Toggle')).toBeInTheDocument();
    expect(screen.getByText('Density Setting')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Prop wiring: ThemeToggle
  // ---------------------------------------------------------------------------
  it('passes themeMode and handler to ThemeToggle', () => {
    arrange();

    const themeToggleProps = mockThemeToggle.mock.calls[0]?.[0];
    expect(themeToggleProps).toBeDefined();
    expect(themeToggleProps).toMatchObject({
      themeMode: 'light',
      onThemeModeChange: mockOnThemeModeChange,
    });
  });

  it('passes dark themeMode to ThemeToggle when provided', () => {
    arrange({ themeMode: 'dark' });

    const themeToggleProps = mockThemeToggle.mock.calls[0]?.[0];
    expect(themeToggleProps).toBeDefined();
    expect(themeToggleProps).toMatchObject({ themeMode: 'dark' });
  });

  // ---------------------------------------------------------------------------
  // Prop wiring: TableDensitySetting
  // ---------------------------------------------------------------------------
  it('passes current tableDensity to TableDensitySetting', () => {
    arrange();

    const tableDensityProps = mockTableDensitySetting.mock.calls[0]?.[0];
    expect(tableDensityProps).toBeDefined();
    expect(tableDensityProps).toMatchObject({ tableDensity: 'comfortable' });
  });

  it('passes compact tableDensity to TableDensitySetting', () => {
    setSettings('compact');
    arrange();

    const tableDensityProps = mockTableDensitySetting.mock.calls[0]?.[0];
    expect(tableDensityProps).toBeDefined();
    expect(tableDensityProps).toMatchObject({ tableDensity: 'compact' });
  });

  it('calls setUserPreferences when density changes', () => {
    arrange();

    // Typed because mockTableDensitySetting uses ArgsTuple typing.
    const lastProps = mockTableDensitySetting.mock.calls.at(-1)?.[0];
    expect(lastProps).toBeDefined();

    lastProps!.onChange('compact');

    expect(mockSetUserPreferences).toHaveBeenCalledWith({ tableDensity: 'compact' });
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders translated title when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'appearance.title') return 'Apparence';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn(), language: 'en' as Locale },
    });

    arrange();

    expect(screen.getByText('Apparence')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('appearance.title', 'Erscheinungsbild / Appearance');
  });
});
