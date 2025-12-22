/**
 * @file ProfileEmailDisplay.test.tsx
 * @module __tests__/app/HamburgerMenu/ProfileSettings/ProfileEmailDisplay
 * @description Tests for profile email display component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileEmailDisplay from '../../../../app/HamburgerMenu/ProfileSettings/ProfileEmailDisplay';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('ProfileEmailDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders email label', () => {
    render(<ProfileEmailDisplay email="user@example.com" isDemo={false} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('displays email when provided and not demo', () => {
    render(<ProfileEmailDisplay email="user@example.com" isDemo={false} />);
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('displays demo message when isDemo is true', () => {
    render(<ProfileEmailDisplay email="user@example.com" isDemo={true} />);
    expect(screen.getByText('Demo Account, No email provided')).toBeInTheDocument();
  });

  it('does not display email when isDemo is true', () => {
    render(<ProfileEmailDisplay email="user@example.com" isDemo={true} />);
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  it('displays em dash when no email and not demo', () => {
    render(<ProfileEmailDisplay isDemo={false} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays em dash when empty email and not demo', () => {
    render(<ProfileEmailDisplay email="" isDemo={false} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('uses translation for email label', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'common:email') return 'E-Mail';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<ProfileEmailDisplay email="user@example.com" isDemo={false} />);
    expect(screen.getByText('E-Mail')).toBeInTheDocument();
  });

  it('uses translation for demo message', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'auth:demo.noEmailProvided') return 'Demo-Konto, keine E-Mail';
      if (key === 'common:email') return 'Email';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<ProfileEmailDisplay email="user@example.com" isDemo={true} />);
    expect(screen.getByText('Demo-Konto, keine E-Mail')).toBeInTheDocument();
  });

  it('handles long email addresses', () => {
    const longEmail = 'very.long.email.address@subdomain.example.com';
    render(<ProfileEmailDisplay email={longEmail} isDemo={false} />);
    expect(screen.getByText(longEmail)).toBeInTheDocument();
  });
});
