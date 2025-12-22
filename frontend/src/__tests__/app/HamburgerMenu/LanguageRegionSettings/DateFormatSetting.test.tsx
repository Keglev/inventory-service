/**
 * @file DateFormatSetting.test.tsx
 * @module __tests__/app/HamburgerMenu/LanguageRegionSettings/DateFormatSetting
 * @description Tests for date format setting component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateFormatSetting from '../../../../app/HamburgerMenu/LanguageRegionSettings/DateFormatSetting';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('DateFormatSetting', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders date format setting component', () => {
    render(<DateFormatSetting dateFormat="DD.MM.YYYY" onChange={mockOnChange} />);
    expect(screen.getByText('Date Format')).toBeInTheDocument();
  });

  it('renders DD.MM.YYYY radio option', () => {
    render(<DateFormatSetting dateFormat="DD.MM.YYYY" onChange={mockOnChange} />);
    expect(screen.getByRole('radio', { name: /DD\.MM\.YYYY/i })).toBeInTheDocument();
  });

  it('renders YYYY-MM-DD radio option', () => {
    render(<DateFormatSetting dateFormat="YYYY-MM-DD" onChange={mockOnChange} />);
    expect(screen.getByRole('radio', { name: /YYYY-MM-DD/i })).toBeInTheDocument();
  });

  it('calls onChange with "DD.MM.YYYY" when selected', async () => {
    const user = userEvent.setup();
    render(<DateFormatSetting dateFormat="YYYY-MM-DD" onChange={mockOnChange} />);

    await user.click(screen.getByRole('radio', { name: /DD\.MM\.YYYY/i }));

    expect(mockOnChange).toHaveBeenCalledWith('DD.MM.YYYY');
  });

  it('calls onChange with "YYYY-MM-DD" when selected', async () => {
    const user = userEvent.setup();
    render(<DateFormatSetting dateFormat="DD.MM.YYYY" onChange={mockOnChange} />);

    await user.click(screen.getByRole('radio', { name: /YYYY-MM-DD/i }));

    expect(mockOnChange).toHaveBeenCalledWith('YYYY-MM-DD');
  });

  it('shows DD.MM.YYYY as checked when selected', () => {
    render(<DateFormatSetting dateFormat="DD.MM.YYYY" onChange={mockOnChange} />);
    const radio = screen.getByRole('radio', { name: /DD\.MM\.YYYY/i });
    expect(radio).toBeChecked();
  });

  it('shows YYYY-MM-DD as checked when selected', () => {
    render(<DateFormatSetting dateFormat="YYYY-MM-DD" onChange={mockOnChange} />);
    const radio = screen.getByRole('radio', { name: /YYYY-MM-DD/i });
    expect(radio).toBeChecked();
  });

  it('defaults to DD.MM.YYYY for invalid format values', () => {
    render(<DateFormatSetting dateFormat="invalid" onChange={mockOnChange} />);
    const radio = screen.getByRole('radio', { name: /DD\.MM\.YYYY/i });
    expect(radio).toBeChecked();
  });

  it('uses translation for label', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'language.dateFormat') return 'Datumsformat';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<DateFormatSetting dateFormat="DD.MM.YYYY" onChange={mockOnChange} />);
    expect(screen.getByText('Datumsformat')).toBeInTheDocument();
  });

  it('allows switching between formats', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DateFormatSetting dateFormat="DD.MM.YYYY" onChange={mockOnChange} />
    );

    await user.click(screen.getByRole('radio', { name: /YYYY-MM-DD/i }));
    expect(mockOnChange).toHaveBeenCalledWith('YYYY-MM-DD');

    rerender(<DateFormatSetting dateFormat="YYYY-MM-DD" onChange={mockOnChange} />);

    await user.click(screen.getByRole('radio', { name: /DD\.MM\.YYYY/i }));
    expect(mockOnChange).toHaveBeenCalledWith('DD.MM.YYYY');
  });

  it('renders radio group with both options', () => {
    render(<DateFormatSetting dateFormat="DD.MM.YYYY" onChange={mockOnChange} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });
});
