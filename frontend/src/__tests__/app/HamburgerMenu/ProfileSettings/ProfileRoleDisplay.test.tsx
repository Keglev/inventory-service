/**
 * @file ProfileRoleDisplay.test.tsx
 * @module __tests__/app/HamburgerMenu/ProfileSettings
 *
 * @description
 * Unit tests for <ProfileRoleDisplay /> — renders the user's role and (optionally) a DEMO badge.
 *
 * Behavior:
 * - Renders a "Role" label.
 * - Displays a formatted role name when provided (e.g., "admin" -> "Admin").
 * - Falls back to "User" when role is missing or empty.
 * - When demo mode is enabled, displays a DEMO badge (Chip).
 *
 * Test strategy:
 * - Verify baseline rendering (label + formatted role).
 * - Verify fallback behavior (missing/empty role).
 * - Verify demo badge presence/absence based on isDemo.
 * - Verify i18n wiring for label and badge.
 * - Add a lightweight regression guard for Chip rendering.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileRoleDisplay from '../../../../app/HamburgerMenu/ProfileSettings/ProfileRoleDisplay';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Props = {
  role?: string;
  isDemo: boolean;
};

describe('ProfileRoleDisplay', () => {
  const defaultProps: Props = {
    role: 'admin',
    isDemo: false,
  };

  /**
   * Arrange helper: renders with defaults + optional overrides.
   */
  const arrange = (overrides?: Partial<Props>) =>
    render(<ProfileRoleDisplay {...defaultProps} {...overrides} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return defaultValue for stable assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: label + formatted role
  // ---------------------------------------------------------------------------
  it('renders the role label', () => {
    arrange({ role: 'admin', isDemo: false });
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('capitalizes role name (admin -> Admin)', () => {
    arrange({ role: 'admin', isDemo: false });
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it.each([
    ['user', 'User'],
    ['manager', 'Manager'],
    ['employee', 'Employee'],
  ] as const)('capitalizes role "%s" -> "%s"', (role, expected) => {
    arrange({ role, isDemo: false });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('preserves uppercase role values (ADMIN stays ADMIN)', () => {
    arrange({ role: 'ADMIN', isDemo: false });
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Fallback behavior
  // ---------------------------------------------------------------------------
  it('falls back to "User" when no role is provided', () => {
    arrange({ role: undefined, isDemo: false });
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('falls back to "User" when role is an empty string', () => {
    arrange({ role: '', isDemo: false });
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Demo badge behavior
  // ---------------------------------------------------------------------------
  it('renders the DEMO badge when demo mode is enabled', () => {
    arrange({ role: 'admin', isDemo: true });
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });

  it('does not render the DEMO badge when demo mode is disabled', () => {
    arrange({ role: 'admin', isDemo: false });
    expect(screen.queryByText('DEMO')).not.toBeInTheDocument();
  });

  it('renders the demo badge as a Chip', () => {
    const { container } = arrange({ role: 'admin', isDemo: true });

    // MUI Chip root class is a reasonable stable hook for a presentational badge.
    expect(container.querySelector('.MuiChip-root')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders translated role label when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'common:role') return 'Rolle';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange({ role: 'admin', isDemo: false });

    expect(screen.getByText('Rolle')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('common:role', 'Role');
  });

  it('renders translated DEMO badge label when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'auth:demoBadge') return 'DEMO';
      if (key === 'common:role') return 'Role';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange({ role: 'admin', isDemo: true });

    expect(screen.getByText('DEMO')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('auth:demoBadge', 'DEMO');
  });
});
