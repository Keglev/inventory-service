/**
 * @file NumberFormatSetting.test.tsx
 * @module __tests__/app/HamburgerMenu/LanguageRegionSettings/NumberFormatSetting
 * @description Tests for number format setting component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NumberFormatSetting from '../../../../app/HamburgerMenu/LanguageRegionSettings/NumberFormatSetting';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('NumberFormatSetting', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders number format setting component', () => {
    render(<NumberFormatSetting numberFormat="DE" onChange={mockOnChange} />);
    expect(screen.getByText('Number Format')).toBeInTheDocument();
  });

  it('renders German format radio option', () => {
    render(<NumberFormatSetting numberFormat="DE" onChange={mockOnChange} />);
    expect(screen.getByRole('radio', { name: /1\.234,56/i })).toBeInTheDocument();
  });

  it('renders US format radio option', () => {
    render(<NumberFormatSetting numberFormat="EN_US" onChange={mockOnChange} />);
    expect(screen.getByRole('radio', { name: /1,234\.56/i })).toBeInTheDocument();
  });

  it('calls onChange with "DE" when German format selected', async () => {
    const user = userEvent.setup();
    render(<NumberFormatSetting numberFormat="EN_US" onChange={mockOnChange} />);

    await user.click(screen.getByRole('radio', { name: /1\.234,56/i }));

    expect(mockOnChange).toHaveBeenCalledWith('DE');
  });

  it('calls onChange with "EN_US" when US format selected', async () => {
    const user = userEvent.setup();
    render(<NumberFormatSetting numberFormat="DE" onChange={mockOnChange} />);

    await user.click(screen.getByRole('radio', { name: /1,234\.56/i }));

    expect(mockOnChange).toHaveBeenCalledWith('EN_US');
  });

  it('shows German format as checked when selected', () => {
    render(<NumberFormatSetting numberFormat="DE" onChange={mockOnChange} />);
    const radio = screen.getByRole('radio', { name: /1\.234,56/i });
    expect(radio).toBeChecked();
  });

  it('shows US format as checked when selected', () => {
    render(<NumberFormatSetting numberFormat="EN_US" onChange={mockOnChange} />);
    const radio = screen.getByRole('radio', { name: /1,234\.56/i });
    expect(radio).toBeChecked();
  });

  it('defaults to DE for invalid format values', () => {
    render(<NumberFormatSetting numberFormat="invalid" onChange={mockOnChange} />);
    const radio = screen.getByRole('radio', { name: /1\.234,56/i });
    expect(radio).toBeChecked();
  });

  it('uses translation for label', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'language.numberFormat') return 'Zahlenformat';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<NumberFormatSetting numberFormat="DE" onChange={mockOnChange} />);
    expect(screen.getByText('Zahlenformat')).toBeInTheDocument();
  });

  it('allows switching between formats', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <NumberFormatSetting numberFormat="DE" onChange={mockOnChange} />
    );

    await user.click(screen.getByRole('radio', { name: /1,234\.56/i }));
    expect(mockOnChange).toHaveBeenCalledWith('EN_US');

    rerender(<NumberFormatSetting numberFormat="EN_US" onChange={mockOnChange} />);

    await user.click(screen.getByRole('radio', { name: /1\.234,56/i }));
    expect(mockOnChange).toHaveBeenCalledWith('DE');
  });

  it('renders radio group with both options', () => {
    render(<NumberFormatSetting numberFormat="DE" onChange={mockOnChange} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });
});
