/**
 * @file ProfileRoleDisplay.test.tsx
 * @module __tests__/app/HamburgerMenu/ProfileSettings/ProfileRoleDisplay
 * @description Tests for profile role display component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileRoleDisplay from '../../../../app/HamburgerMenu/ProfileSettings/ProfileRoleDisplay';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('ProfileRoleDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders role label', () => {
    render(<ProfileRoleDisplay role="admin" isDemo={false} />);
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('capitalizes role name', () => {
    render(<ProfileRoleDisplay role="admin" isDemo={false} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays User when no role provided', () => {
    render(<ProfileRoleDisplay isDemo={false} />);
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('displays DEMO badge when isDemo is true', () => {
    render(<ProfileRoleDisplay role="admin" isDemo={true} />);
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });

  it('does not display DEMO badge when isDemo is false', () => {
    render(<ProfileRoleDisplay role="admin" isDemo={false} />);
    expect(screen.queryByText('DEMO')).not.toBeInTheDocument();
  });

  it('capitalizes different roles correctly', () => {
    const { rerender } = render(<ProfileRoleDisplay role="user" isDemo={false} />);
    expect(screen.getByText('User')).toBeInTheDocument();

    rerender(<ProfileRoleDisplay role="manager" isDemo={false} />);
    expect(screen.getByText('Manager')).toBeInTheDocument();

    rerender(<ProfileRoleDisplay role="employee" isDemo={false} />);
    expect(screen.getByText('Employee')).toBeInTheDocument();
  });

  it('handles uppercase role', () => {
    render(<ProfileRoleDisplay role="ADMIN" isDemo={false} />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('uses translation for role label', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'common:role') return 'Rolle';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<ProfileRoleDisplay role="admin" isDemo={false} />);
    expect(screen.getByText('Rolle')).toBeInTheDocument();
  });

  it('uses translation for DEMO badge', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'auth:demoBadge') return 'DEMO';
      if (key === 'common:role') return 'Role';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<ProfileRoleDisplay role="admin" isDemo={true} />);
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });

  it('renders chip component for demo badge', () => {
    const { container } = render(<ProfileRoleDisplay role="admin" isDemo={true} />);
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });

  it('handles empty role string', () => {
    render(<ProfileRoleDisplay role="" isDemo={false} />);
    expect(screen.getByText('User')).toBeInTheDocument();
  });
});
