/**
 * @file LocalizationDisplay.test.tsx
 * @module __tests__/app/footer/LocalizationDisplay
 * @description Tests for localization information display component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocalizationDisplay from '../../../app/footer/LocalizationDisplay';

// Hoisted mock
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('LocalizationDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders section title', () => {
    render(<LocalizationDisplay currentLanguage="EN" region="DE" />);
    expect(screen.getByText('Language & Region')).toBeInTheDocument();
  });

  it('renders language label', () => {
    render(<LocalizationDisplay currentLanguage="EN" region="DE" />);
    expect(screen.getByText(/Language.*:/)).toBeInTheDocument();
  });

  it('renders region label', () => {
    render(<LocalizationDisplay currentLanguage="EN" region="DE" />);
    expect(screen.getByText(/Region.*:/)).toBeInTheDocument();
  });

  it('renders current language', () => {
    render(<LocalizationDisplay currentLanguage="EN" region="DE" />);
    expect(screen.getByText(/Language.*EN/)).toBeInTheDocument();
  });

  it('renders current region', () => {
    render(<LocalizationDisplay currentLanguage="EN" region="DE" />);
    expect(screen.getByText(/Region.*DE/)).toBeInTheDocument();
  });

  it('renders with German language', () => {
    render(<LocalizationDisplay currentLanguage="DE" region="DE" />);
    expect(screen.getByText(/Language.*DE/)).toBeInTheDocument();
  });

  it('renders with different region', () => {
    render(<LocalizationDisplay currentLanguage="EN" region="US" />);
    expect(screen.getByText(/Region.*US/)).toBeInTheDocument();
  });

  it('uses translations for section title', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<LocalizationDisplay currentLanguage="EN" region="DE" />);

    expect(mockT).toHaveBeenCalledWith('footer:section.localization', 'Language & Region');
  });

  it('uses translations for labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<LocalizationDisplay currentLanguage="EN" region="DE" />);

    expect(mockT).toHaveBeenCalledWith('footer:locale.language', 'Language');
    expect(mockT).toHaveBeenCalledWith('footer:locale.region', 'Region');
  });
});
