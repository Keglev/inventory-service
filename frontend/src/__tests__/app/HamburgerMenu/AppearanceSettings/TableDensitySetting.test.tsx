/**
 * @file TableDensitySetting.test.tsx
 * @module __tests__/app/HamburgerMenu/AppearanceSettings
 *
 * @description
 * Unit tests for <TableDensitySetting /> — allows users to switch table density
 * between "comfortable" (standard) and "compact".
 *
 * Test strategy:
 * - Verify the component renders labels and both options.
 * - Verify interaction: clicking options calls onChange with the correct density.
 * - Verify selection state reflects the current density.
 * - Verify defensive behavior: invalid density values fall back to "comfortable".
 * - Verify i18n integration by mocking translations and asserting rendered labels.
 *
 * Notes:
 * - We intentionally assert the MUI "selected" class here because this component’s
 *   core behavior is selection state; it’s a reasonable UI contract for a toggle group.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableDensitySetting from '../../../../app/HamburgerMenu/AppearanceSettings/TableDensitySetting';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Density = 'comfortable' | 'compact' | string;

describe('TableDensitySetting', () => {
  const mockOnChange = vi.fn();

  /**
   * Arrange helper:
   * Centralizes rendering and keeps each test focused on its scenario.
   */
  const arrange = (tableDensity: Density) =>
    render(<TableDensitySetting tableDensity={tableDensity} onChange={mockOnChange} />);

  /**
   * Query helpers:
   * Use accessible names because these are user-facing controls.
   * (We keep regex to support translated labels like "Kompakt".)
   */
  const getStandardButton = () => screen.getByRole('button', { name: /standard|normal/i });
  const getCompactButton = () => screen.getByRole('button', { name: /kompakt|compact/i });

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange.mockReset();

    // Deterministic translation stub: return defaultValue for stable assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: labels + options
  // ---------------------------------------------------------------------------
  it('renders the density setting label', () => {
    arrange('comfortable');
    expect(screen.getByText('Density')).toBeInTheDocument();
  });

  it('renders both density options', () => {
    arrange('comfortable');
    expect(getStandardButton()).toBeInTheDocument();
    expect(getCompactButton()).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Interaction: calling onChange
  // ---------------------------------------------------------------------------
  it('calls onChange with "comfortable" when standard is clicked', async () => {
    const user = userEvent.setup();
    arrange('compact');

    await user.click(getStandardButton());
    expect(mockOnChange).toHaveBeenCalledWith('comfortable');
  });

  it('calls onChange with "compact" when compact is clicked', async () => {
    const user = userEvent.setup();
    arrange('comfortable');

    await user.click(getCompactButton());
    expect(mockOnChange).toHaveBeenCalledWith('compact');
  });

  it('does not call onChange when clicking the currently selected option', async () => {
    const user = userEvent.setup();
    arrange('comfortable');

    // Clicking the already-selected option should be a no-op.
    await user.click(getStandardButton());
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Selection state
  // ---------------------------------------------------------------------------
  it('marks "comfortable" as selected when tableDensity is comfortable', () => {
    arrange('comfortable');
    expect(getStandardButton()).toHaveClass('Mui-selected');
  });

  it('marks "compact" as selected when tableDensity is compact', () => {
    arrange('compact');
    expect(getCompactButton()).toHaveClass('Mui-selected');
  });

  it('falls back to comfortable for invalid density values', () => {
    // Defensive behavior: UI should not break on unexpected/legacy values.
    arrange('invalid');
    expect(getStandardButton()).toHaveClass('Mui-selected');
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders translated labels when i18n provides them', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'appearance.density') return 'Dichte';
      if (key === 'appearance.standard') return 'Normal';
      if (key === 'appearance.compact') return 'Kompakt';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange('comfortable');

    // Assert rendered text (user-visible outcome)...
    expect(screen.getByText('Dichte')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Kompakt')).toBeInTheDocument();

    // ...and ensure we requested the correct keys (integration wiring).
    expect(mockT).toHaveBeenCalledWith('appearance.density', 'Density');
    expect(mockT).toHaveBeenCalledWith('appearance.standard', 'Standard');
    expect(mockT).toHaveBeenCalledWith('appearance.compact', 'Compact');
  });

  // ---------------------------------------------------------------------------
  // Regression: switching between modes (controlled component behavior)
  // ---------------------------------------------------------------------------
  it('allows switching between modes', async () => {
    const user = userEvent.setup();

    const { rerender } = arrange('comfortable');

    await user.click(getCompactButton());
    expect(mockOnChange).toHaveBeenCalledWith('compact');

    // Simulate parent state update (component is controlled via props).
    rerender(<TableDensitySetting tableDensity="compact" onChange={mockOnChange} />);

    await user.click(getStandardButton());
    expect(mockOnChange).toHaveBeenCalledWith('comfortable');
  });
});
