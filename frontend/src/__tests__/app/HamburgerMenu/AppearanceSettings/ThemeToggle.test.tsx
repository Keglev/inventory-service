/**
 * @file ThemeToggle.test.tsx
 * @module __tests__/app/HamburgerMenu/AppearanceSettings/ThemeToggle
 * @description Tests for theme toggle component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../../../app/HamburgerMenu/AppearanceSettings/ThemeToggle';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('ThemeToggle', () => {
  const mockOnThemeModeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders theme toggle component', () => {
    render(<ThemeToggle themeMode="light" onThemeModeChange={mockOnThemeModeChange} />);
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('displays light mode label when in light mode', () => {
    render(<ThemeToggle themeMode="light" onThemeModeChange={mockOnThemeModeChange} />);
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('displays dark mode label when in dark mode', () => {
    render(<ThemeToggle themeMode="dark" onThemeModeChange={mockOnThemeModeChange} />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('renders light mode button', () => {
    render(<ThemeToggle themeMode="light" onThemeModeChange={mockOnThemeModeChange} />);
    const lightButton = screen.getByTitle('Light Mode');
    expect(lightButton).toBeInTheDocument();
  });

  it('renders dark mode button', () => {
    render(<ThemeToggle themeMode="dark" onThemeModeChange={mockOnThemeModeChange} />);
    const darkButton = screen.getByTitle('Dark Mode');
    expect(darkButton).toBeInTheDocument();
  });

  it('calls onThemeModeChange with "light" when light button clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle themeMode="dark" onThemeModeChange={mockOnThemeModeChange} />);

    await user.click(screen.getByTitle('Light Mode'));

    expect(mockOnThemeModeChange).toHaveBeenCalledWith('light');
  });

  it('calls onThemeModeChange with "dark" when dark button clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle themeMode="light" onThemeModeChange={mockOnThemeModeChange} />);

    await user.click(screen.getByTitle('Dark Mode'));

    expect(mockOnThemeModeChange).toHaveBeenCalledWith('dark');
  });

  it('uses translations for labels', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'appearance.theme') return 'Tema';
      if (key === 'appearance.light') return 'Claro';
      if (key === 'appearance.lightMode') return 'Modo Claro';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<ThemeToggle themeMode="light" onThemeModeChange={mockOnThemeModeChange} />);
    
    expect(screen.getByText('Tema')).toBeInTheDocument();
    expect(screen.getByText('Claro')).toBeInTheDocument();
    expect(screen.getByTitle('Modo Claro')).toBeInTheDocument();
  });

  it('renders light and dark icons', () => {
    const { container } = render(
      <ThemeToggle themeMode="light" onThemeModeChange={mockOnThemeModeChange} />
    );
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(2);
  });

  it('allows switching from light to dark', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle themeMode="light" onThemeModeChange={mockOnThemeModeChange} />);

    expect(screen.getByText('Light')).toBeInTheDocument();
    await user.click(screen.getByTitle('Dark Mode'));
    expect(mockOnThemeModeChange).toHaveBeenCalledWith('dark');
  });

  it('allows switching from dark to light', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle themeMode="dark" onThemeModeChange={mockOnThemeModeChange} />);

    expect(screen.getByText('Dark')).toBeInTheDocument();
    await user.click(screen.getByTitle('Light Mode'));
    expect(mockOnThemeModeChange).toHaveBeenCalledWith('light');
  });
});
