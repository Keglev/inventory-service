/**
 * @file ProfileMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu
 *
 * @description
 * Unit tests for <ProfileMenuSection /> — reads the authenticated user from useAuth()
 * and renders three “display” components:
 * - ProfileNameDisplay
 * - ProfileEmailDisplay
 * - ProfileRoleDisplay
 *
 * Tests focus on orchestration:
 * - section title rendering (and i18n override)
 * - child component presence
 * - correct prop wiring for normal user, demo user, and missing user states
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileMenuSection from '../../../app/HamburgerMenu/ProfileMenuSection';

// -----------------------------------------------------------------------------
// Minimal types used for prop-wiring assertions
// -----------------------------------------------------------------------------
type User = {
  fullName?: string;
  email?: string;
  role?: string;
  isDemo?: boolean;
};

type ProfileNameDisplayProps = { fullName?: string };
type ProfileEmailDisplayProps = { email?: string; isDemo?: boolean };
type ProfileRoleDisplayProps = { role?: string; isDemo?: boolean };

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

const mockProfileNameDisplay = vi.hoisted(() =>
  vi.fn<[ProfileNameDisplayProps], React.ReactElement>(() => <div>Name Display</div>),
);

const mockProfileEmailDisplay = vi.hoisted(() =>
  vi.fn<[ProfileEmailDisplayProps], React.ReactElement>(() => <div>Email Display</div>),
);

const mockProfileRoleDisplay = vi.hoisted(() =>
  vi.fn<[ProfileRoleDisplayProps], React.ReactElement>(() => <div>Role Display</div>),
);

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('../../../app/HamburgerMenu/ProfileSettings', () => ({
  ProfileNameDisplay: mockProfileNameDisplay,
  ProfileEmailDisplay: mockProfileEmailDisplay,
  ProfileRoleDisplay: mockProfileRoleDisplay,
}));

describe('ProfileMenuSection', () => {
  const arrange = () => render(<ProfileMenuSection />);

  const setAuthUser = (user: User | null) => {
    mockUseAuth.mockReturnValue({ user });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });

    setAuthUser({
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      isDemo: false,
    });
  });

  it('renders the profile section title', () => {
    arrange();
    expect(screen.getByText('Mein Profil / My Profile')).toBeInTheDocument();
  });

  it('renders the three profile display components', () => {
    arrange();
    expect(screen.getByText('Name Display')).toBeInTheDocument();
    expect(screen.getByText('Email Display')).toBeInTheDocument();
    expect(screen.getByText('Role Display')).toBeInTheDocument();
  });

  it('passes user.fullName to ProfileNameDisplay', () => {
    arrange();

    const lastProps = mockProfileNameDisplay.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ fullName: 'John Doe' }));
  });

  it('passes user.email and user.isDemo to ProfileEmailDisplay', () => {
    arrange();

    const lastProps = mockProfileEmailDisplay.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(
      expect.objectContaining({
        email: 'john@example.com',
        isDemo: false,
      }),
    );
  });

  it('passes user.role and user.isDemo to ProfileRoleDisplay', () => {
    arrange();

    const lastProps = mockProfileRoleDisplay.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(
      expect.objectContaining({
        role: 'admin',
        isDemo: false,
      }),
    );
  });

  it('handles demo user correctly (isDemo=true)', () => {
    setAuthUser({
      fullName: 'Demo User',
      email: '',
      role: 'user',
      isDemo: true,
    });

    arrange();

    const emailProps = mockProfileEmailDisplay.mock.calls.at(-1)?.[0];
    const roleProps = mockProfileRoleDisplay.mock.calls.at(-1)?.[0];

    expect(emailProps).toEqual(expect.objectContaining({ isDemo: true }));
    expect(roleProps).toEqual(expect.objectContaining({ isDemo: true }));
  });

  it('handles missing user data gracefully (user=null)', () => {
    setAuthUser(null);

    arrange();

    const nameProps = mockProfileNameDisplay.mock.calls.at(-1)?.[0];
    expect(nameProps).toEqual(expect.objectContaining({ fullName: undefined }));
  });

  it('renders translated title when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'profile.title') return 'Mon Profil';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(screen.getByText('Mon Profil')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('profile.title', 'Mein Profil / My Profile');
  });
});
