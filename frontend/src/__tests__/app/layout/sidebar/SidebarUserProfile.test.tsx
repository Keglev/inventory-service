/**
 * @file SidebarUserProfile.test.tsx
 * @module __tests__/app/layout/sidebar/SidebarUserProfile
 * @description
 * Tests for SidebarUserProfile.
 *
 * Scope:
 * - Displays user identity (full name + role) with translated labels.
 * - Provides safe fallbacks when user data is missing/undefined.
 *
 * Out of scope:
 * - Authentication/session logic
 * - Role authorization rules
 * - Profile editing flows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SidebarUserProfile from '../../../../app/layout/sidebar/SidebarUserProfile';

/**
 * i18n mock:
 * Return defaultValue for stable assertions independent of translation JSON.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type User = { fullName?: string; role?: string } | undefined;

describe('SidebarUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
    });
  });

  function renderProfile(user: User) {
    return render(<SidebarUserProfile user={user} />);
  }

  it('renders translated labels and user values when provided', () => {
    // Primary UX contract: show identity and role for the authenticated user.
    renderProfile({ fullName: 'John Doe', role: 'Admin' });

    expect(screen.getByText('Logged in as:')).toBeInTheDocument();
    expect(screen.getByText('Role:')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  describe('Fallback behavior', () => {
    const cases: Array<{
      name: string;
      user: User;
      expectedName: string;
      expectedRole: string;
    }> = [
      {
        name: 'user is undefined',
        user: undefined,
        expectedName: 'User',
        expectedRole: 'user',
      },
      {
        name: 'fullName is missing',
        user: { role: 'Admin' },
        expectedName: 'User',
        expectedRole: 'Admin',
      },
      {
        name: 'role is missing',
        user: { fullName: 'John Doe' },
        expectedName: 'John Doe',
        expectedRole: 'user',
      },
      {
        name: 'user object is empty',
        user: {},
        expectedName: 'User',
        expectedRole: 'user',
      },
    ];

    cases.forEach(({ name, user, expectedName, expectedRole }) => {
      it(`uses fallbacks when ${name}`, () => {
        // Defensive rendering: component must not crash when user information is partial.
        renderProfile(user);

        expect(screen.getByText(expectedName)).toBeInTheDocument();
        expect(screen.getByText(expectedRole)).toBeInTheDocument();
      });
    });
  });

  describe('Role rendering', () => {
    const roles = ['Manager', 'Viewer', 'Warehouse Operator'] as const;

    roles.forEach((role) => {
      it(`renders role "${role}" when provided`, () => {
        // Ensures role value is displayed verbatim as provided by the session/user object.
        renderProfile({ fullName: 'Test User', role });

        expect(screen.getByText(role)).toBeInTheDocument();
      });
    });
  });
});
