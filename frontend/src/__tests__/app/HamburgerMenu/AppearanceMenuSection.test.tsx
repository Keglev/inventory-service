/**
 * @file AppearanceMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu/AppearanceMenuSection
 * @description Tests for appearance menu section component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppearanceMenuSection from '../../../app/HamburgerMenu/AppearanceMenuSection';

// Hoisted mocks
const mockSetUserPreferences = vi.hoisted(() => vi.fn());
const mockUseSettings = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockThemeToggle = vi.hoisted(() => vi.fn(() => <div>Theme Toggle</div>));
const mockTableDensitySetting = vi.hoisted(() => vi.fn(() => <div>Density Setting</div>));

// Mock hooks
vi.mock('../../../hooks/useSettings', () => ({
  useSettings: mockUseSettings,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

// Mock appearance settings components
vi.mock('../../../app/HamburgerMenu/AppearanceSettings', () => ({
  ThemeToggle: mockThemeToggle,
  TableDensitySetting: mockTableDensitySetting,
}));

describe('AppearanceMenuSection', () => {
  const mockOnThemeModeChange = vi.fn();

  const defaultProps = {
    themeMode: 'light' as const,
    onThemeModeChange: mockOnThemeModeChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
    mockUseSettings.mockReturnValue({
      userPreferences: {
        tableDensity: 'comfortable',
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'DE',
      },
      setUserPreferences: mockSetUserPreferences,
    });
    mockThemeToggle.mockReturnValue(<div>Theme Toggle</div>);
    mockTableDensitySetting.mockReturnValue(<div>Density Setting</div>);
  });

  it('renders appearance section title', () => {
    render(<AppearanceMenuSection {...defaultProps} />);
    expect(screen.getByText('Erscheinungsbild / Appearance')).toBeInTheDocument();
  });

  it('renders ThemeToggle component', () => {
    render(<AppearanceMenuSection {...defaultProps} />);
    expect(screen.getByText('Theme Toggle')).toBeInTheDocument();
  });

  it('renders TableDensitySetting component', () => {
    render(<AppearanceMenuSection {...defaultProps} />);
    expect(screen.getByText('Density Setting')).toBeInTheDocument();
  });

  it('passes themeMode to ThemeToggle', () => {
    render(<AppearanceMenuSection {...defaultProps} />);
    expect(mockThemeToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        themeMode: 'light',
        onThemeModeChange: mockOnThemeModeChange,
      }),
      undefined
    );
  });

  it('passes dark themeMode to ThemeToggle', () => {
    render(<AppearanceMenuSection {...defaultProps} themeMode="dark" />);
    expect(mockThemeToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        themeMode: 'dark',
      }),
      undefined
    );
  });

  it('passes tableDensity to TableDensitySetting', () => {
    render(<AppearanceMenuSection {...defaultProps} />);
    expect(mockTableDensitySetting).toHaveBeenCalledWith(
      expect.objectContaining({
        tableDensity: 'comfortable',
      }),
      undefined
    );
  });

  it('passes compact tableDensity to TableDensitySetting', () => {
    mockUseSettings.mockReturnValue({
      userPreferences: {
        tableDensity: 'compact',
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'DE',
      },
      setUserPreferences: mockSetUserPreferences,
    });

    render(<AppearanceMenuSection {...defaultProps} />);
    expect(mockTableDensitySetting).toHaveBeenCalledWith(
      expect.objectContaining({
        tableDensity: 'compact',
      }),
      undefined
    );
  });

  it('passes onChange handler to TableDensitySetting', () => {
    render(<AppearanceMenuSection {...defaultProps} />);
    expect(mockTableDensitySetting).toHaveBeenCalledWith(
      expect.objectContaining({
        onChange: expect.any(Function),
      }),
      undefined
    );
  });

  it('calls setUserPreferences when density changes', () => {
    render(<AppearanceMenuSection {...defaultProps} />);
    
    // Get the onChange callback that was passed to TableDensitySetting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastCall = mockTableDensitySetting.mock.lastCall as any;
    expect(lastCall).toBeDefined();
    const propsPassedToMock = lastCall[0];
    expect(propsPassedToMock.onChange).toBeDefined();
    
    // Call the onChange handler
    propsPassedToMock.onChange('compact');

    expect(mockSetUserPreferences).toHaveBeenCalledWith({ tableDensity: 'compact' });
  });

  it('uses translation for title', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => {
      if (_key === 'appearance.title') return 'Apparence';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<AppearanceMenuSection {...defaultProps} />);
    expect(screen.getByText('Apparence')).toBeInTheDocument();
  });
});
