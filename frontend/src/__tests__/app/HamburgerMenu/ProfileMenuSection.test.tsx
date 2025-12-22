/**
 * @file ProfileMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu/ProfileMenuSection
 * @description Tests for profile menu section component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileMenuSection from '../../../app/HamburgerMenu/ProfileMenuSection';

// Hoisted mocks
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockProfileNameDisplay = vi.hoisted(() => vi.fn(() => <div>Name Display</div>));
const mockProfileEmailDisplay = vi.hoisted(() => vi.fn(() => <div>Email Display</div>));
const mockProfileRoleDisplay = vi.hoisted(() => vi.fn(() => <div>Role Display</div>));

// Mock hooks
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

// Mock profile settings components
vi.mock('../../../app/HamburgerMenu/ProfileSettings', () => ({
  ProfileNameDisplay: mockProfileNameDisplay,
  ProfileEmailDisplay: mockProfileEmailDisplay,
  ProfileRoleDisplay: mockProfileRoleDisplay,
}));

describe('ProfileMenuSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
    mockUseAuth.mockReturnValue({
      user: {
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        isDemo: false,
      },
    });
    mockProfileNameDisplay.mockReturnValue(<div>Name Display</div>);
    mockProfileEmailDisplay.mockReturnValue(<div>Email Display</div>);
    mockProfileRoleDisplay.mockReturnValue(<div>Role Display</div>);
  });

  it('renders profile section title', () => {
    render(<ProfileMenuSection />);
    expect(screen.getByText('Mein Profil / My Profile')).toBeInTheDocument();
  });

  it('renders ProfileNameDisplay component', () => {
    render(<ProfileMenuSection />);
    expect(screen.getByText('Name Display')).toBeInTheDocument();
  });

  it('renders ProfileEmailDisplay component', () => {
    render(<ProfileMenuSection />);
    expect(screen.getByText('Email Display')).toBeInTheDocument();
  });

  it('renders ProfileRoleDisplay component', () => {
    render(<ProfileMenuSection />);
    expect(screen.getByText('Role Display')).toBeInTheDocument();
  });

  it('passes fullName to ProfileNameDisplay', () => {
    render(<ProfileMenuSection />);
    expect(mockProfileNameDisplay).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'John Doe' }),
      undefined
    );
  });

  it('passes email and isDemo to ProfileEmailDisplay', () => {
    render(<ProfileMenuSection />);
    expect(mockProfileEmailDisplay).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john@example.com',
        isDemo: false,
      }),
      undefined
    );
  });

  it('passes role and isDemo to ProfileRoleDisplay', () => {
    render(<ProfileMenuSection />);
    expect(mockProfileRoleDisplay).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'admin',
        isDemo: false,
      }),
      undefined
    );
  });

  it('handles demo user correctly', () => {
    mockUseAuth.mockReturnValue({
      user: {
        fullName: 'Demo User',
        email: '',
        role: 'user',
        isDemo: true,
      },
    });

    render(<ProfileMenuSection />);

    expect(mockProfileEmailDisplay).toHaveBeenCalledWith(
      expect.objectContaining({ isDemo: true }),
      undefined
    );
    expect(mockProfileRoleDisplay).toHaveBeenCalledWith(
      expect.objectContaining({ isDemo: true }),
      undefined
    );
  });

  it('handles missing user data', () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(<ProfileMenuSection />);

    expect(mockProfileNameDisplay).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: undefined }),
      undefined
    );
  });

  it('uses translation for title', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'profile.title') return 'Mon Profil';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<ProfileMenuSection />);
    expect(screen.getByText('Mon Profil')).toBeInTheDocument();
  });
});
