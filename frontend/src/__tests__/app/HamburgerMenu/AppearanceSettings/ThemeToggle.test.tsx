/**
 * @file ThemeToggle.test.tsx
 * @module __tests__/app/HamburgerMenu/AppearanceSettings
 *
 * @description
 * Unit tests for <ThemeToggle /> — allows users to switch UI theme between light and dark mode.
 *
 * Test strategy:
 * - Verify the component renders its label and reflects the active mode.
 * - Verify interaction: clicking a mode control calls the callback with the correct value.
 * - Verify i18n wiring by mocking translations and asserting rendered labels/tooltips.
 *
 * Notes:
 * - We query the toggle controls by `title` because the component exposes its tooltip/title
 *   as the primary accessible name in the current implementation.
 * - We keep one minimal "icons" test as a regression guard (ensures both icons render).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../../../app/HamburgerMenu/AppearanceSettings/ThemeToggle';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type ThemeMode = 'light' | 'dark';

describe('ThemeToggle', () => {
  const mockOnThemeModeChange = vi.fn();

  /**
   * Arrange helper: centralizes render logic and keeps tests concise.
   */
  const arrange = (themeMode: ThemeMode) =>
    render(<ThemeToggle themeMode={themeMode} onThemeModeChange={mockOnThemeModeChange} />);

  /**
   * Query helpers:
   * Use case-insensitive title matching to support translations.
   */
  const getLightButton = () => screen.getByTitle(/light mode|modo claro/i);
  const getDarkButton = () => screen.getByTitle(/dark mode|modo escuro|modo oscuro/i);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnThemeModeChange.mockReset();

    // Deterministic translation stub: return defaultValue for stable assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: labels + active mode
  // ---------------------------------------------------------------------------
  it('renders the theme section label', () => {
    arrange('light');
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('shows the light mode label when in light mode', () => {
    arrange('light');
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('shows the dark mode label when in dark mode', () => {
    arrange('dark');
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('renders the light and dark mode controls', () => {
    arrange('light');
    expect(getLightButton()).toBeInTheDocument();
    expect(getDarkButton()).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Interaction: callback behavior
  // ---------------------------------------------------------------------------
  it('calls onThemeModeChange with "light" when light control is clicked', async () => {
    const user = userEvent.setup();
    arrange('dark');

    await user.click(getLightButton());
    expect(mockOnThemeModeChange).toHaveBeenCalledWith('light');
  });

  it('calls onThemeModeChange with "dark" when dark control is clicked', async () => {
    const user = userEvent.setup();
    arrange('light');

    await user.click(getDarkButton());
    expect(mockOnThemeModeChange).toHaveBeenCalledWith('dark');
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders translated labels and tooltips when provided by i18n', () => {
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

    arrange('light');

    // User-visible outcome
    expect(screen.getByText('Tema')).toBeInTheDocument();
    expect(screen.getByText('Claro')).toBeInTheDocument();
    expect(screen.getByTitle('Modo Claro')).toBeInTheDocument();

    // Key wiring (integration contract)
    expect(mockT).toHaveBeenCalledWith('appearance.theme', 'Theme');
    expect(mockT).toHaveBeenCalledWith('appearance.light', 'Light');
    expect(mockT).toHaveBeenCalledWith('appearance.lightMode', 'Light Mode');
  });

  // ---------------------------------------------------------------------------
  // Regression: icon presence
  // ---------------------------------------------------------------------------
  it('renders light and dark icons', () => {
    // Implementation-level assertion (svg count), kept intentionally lightweight.
    const { container } = arrange('light');
    expect(container.querySelectorAll('svg').length).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // Regression: switching scenarios (controlled component usage)
  // ---------------------------------------------------------------------------
  it('allows switching from light to dark', async () => {
    const user = userEvent.setup();
    arrange('light');

    expect(screen.getByText('Light')).toBeInTheDocument();
    await user.click(getDarkButton());
    expect(mockOnThemeModeChange).toHaveBeenCalledWith('dark');
  });

  it('allows switching from dark to light', async () => {
    const user = userEvent.setup();
    arrange('dark');

    expect(screen.getByText('Dark')).toBeInTheDocument();
    await user.click(getLightButton());
    expect(mockOnThemeModeChange).toHaveBeenCalledWith('light');
  });
});
