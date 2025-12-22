/**
 * @file ProfileNameDisplay.test.tsx
 * @module __tests__/app/HamburgerMenu/ProfileSettings/ProfileNameDisplay
 * @description Tests for profile name display component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileNameDisplay from '../../../../app/HamburgerMenu/ProfileSettings/ProfileNameDisplay';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('ProfileNameDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders name label', () => {
    render(<ProfileNameDisplay fullName="John Doe" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('displays full name when provided', () => {
    render(<ProfileNameDisplay fullName="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays em dash when no name provided', () => {
    render(<ProfileNameDisplay />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays em dash when empty name provided', () => {
    render(<ProfileNameDisplay fullName="" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('uses translation for label', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'common:name') return 'Name';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<ProfileNameDisplay fullName="John Doe" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('handles long names', () => {
    const longName = 'Johann Wolfgang von Goethe Maximilian Schmidt';
    render(<ProfileNameDisplay fullName={longName} />);
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it('handles names with special characters', () => {
    render(<ProfileNameDisplay fullName="José María O'Brien" />);
    expect(screen.getByText("José María O'Brien")).toBeInTheDocument();
  });
});
