/**
 * @file LanguageRegionMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu/LanguageRegionMenuSection
 * @description Tests for language region menu section component.
 * NOTE: File exceeds 250 lines - refactor recommended
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LanguageRegionMenuSection from '../../../app/HamburgerMenu/LanguageRegionMenuSection';

// Hoisted mocks
const mockSetUserPreferences = vi.hoisted(() => vi.fn());
const mockUseSettings = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockLanguageToggle = vi.hoisted(() => vi.fn(() => <div>Language Toggle</div>));
const mockDateFormatSetting = vi.hoisted(() => vi.fn(() => <div>Date Format</div>));
const mockNumberFormatSetting = vi.hoisted(() => vi.fn(() => <div>Number Format</div>));

// Mock hooks
vi.mock('../../../hooks/useSettings', () => ({
  useSettings: mockUseSettings,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

// Mock language region settings components
vi.mock('../../../app/HamburgerMenu/LanguageRegionSettings', () => ({
  LanguageToggle: mockLanguageToggle,
  DateFormatSetting: mockDateFormatSetting,
  NumberFormatSetting: mockNumberFormatSetting,
}));

describe('LanguageRegionMenuSection', () => {
  const mockOnLocaleChange = vi.fn();

  const defaultProps = {
    locale: 'en' as const,
    onLocaleChange: mockOnLocaleChange,
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
    mockLanguageToggle.mockReturnValue(<div>Language Toggle</div>);
    mockDateFormatSetting.mockReturnValue(<div>Date Format</div>);
    mockNumberFormatSetting.mockReturnValue(<div>Number Format</div>);
  });

  it('renders language region section title', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(screen.getByText('Sprache & Region / Language & Region')).toBeInTheDocument();
  });

  it('renders LanguageToggle component', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(screen.getByText('Language Toggle')).toBeInTheDocument();
  });

  it('renders DateFormatSetting component', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(screen.getByText('Date Format')).toBeInTheDocument();
  });

  it('renders NumberFormatSetting component', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(screen.getByText('Number Format')).toBeInTheDocument();
  });

  it('passes locale to LanguageToggle', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(mockLanguageToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        onLocaleChange: mockOnLocaleChange,
      }),
      undefined
    );
  });

  it('passes German locale to LanguageToggle', () => {
    render(<LanguageRegionMenuSection {...defaultProps} locale="de" />);
    expect(mockLanguageToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'de',
      }),
      undefined
    );
  });

  it('passes dateFormat to DateFormatSetting', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(mockDateFormatSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFormat: 'DD.MM.YYYY',
      }),
      undefined
    );
  });

  it('passes ISO dateFormat to DateFormatSetting', () => {
    mockUseSettings.mockReturnValue({
      userPreferences: {
        tableDensity: 'comfortable',
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'DE',
      },
      setUserPreferences: mockSetUserPreferences,
    });

    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(mockDateFormatSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFormat: 'YYYY-MM-DD',
      }),
      undefined
    );
  });

  it('passes numberFormat to NumberFormatSetting', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(mockNumberFormatSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        numberFormat: 'DE',
      }),
      undefined
    );
  });

  it('passes US numberFormat to NumberFormatSetting', () => {
    mockUseSettings.mockReturnValue({
      userPreferences: {
        tableDensity: 'comfortable',
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'EN_US',
      },
      setUserPreferences: mockSetUserPreferences,
    });

    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(mockNumberFormatSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        numberFormat: 'EN_US',
      }),
      undefined
    );
  });

  it('calls setUserPreferences when date format changes', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    
    // Get the onChange callback that was passed to DateFormatSetting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastCall = mockDateFormatSetting.mock.lastCall as any;
    expect(lastCall).toBeDefined();
    const propsPassedToMock = lastCall[0];
    expect(propsPassedToMock.onChange).toBeDefined();
    
    // Call the onChange handler
    propsPassedToMock.onChange('YYYY-MM-DD');

    expect(mockSetUserPreferences).toHaveBeenCalledWith({ dateFormat: 'YYYY-MM-DD' });
  });

  it('calls setUserPreferences when number format changes', () => {
    render(<LanguageRegionMenuSection {...defaultProps} />);
    
    // Get the onChange callback that was passed to NumberFormatSetting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastCall = mockNumberFormatSetting.mock.lastCall as any;
    expect(lastCall).toBeDefined();
    const propsPassedToMock = lastCall[0];
    expect(propsPassedToMock.onChange).toBeDefined();
    
    // Call the onChange handler
    propsPassedToMock.onChange('EN_US');

    expect(mockSetUserPreferences).toHaveBeenCalledWith({ numberFormat: 'EN_US' });
  });

  it('uses translation for title', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => {
      if (_key === 'language.title') return 'Langue et Région';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<LanguageRegionMenuSection {...defaultProps} />);
    expect(screen.getByText('Langue et Région')).toBeInTheDocument();
  });
});
