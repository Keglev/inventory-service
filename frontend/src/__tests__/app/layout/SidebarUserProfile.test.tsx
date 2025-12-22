/**
 * @file SidebarUserProfile.test.tsx
 *
 * @what_is_under_test SidebarUserProfile component
 * @responsibility Displays user identity (full name and role) in the sidebar footer
 * @out_of_scope User authentication, role management, profile editing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SidebarUserProfile from '../../../app/layout/sidebar/SidebarUserProfile';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

describe('SidebarUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User data display', () => {
    it('renders user full name', () => {
      render(<SidebarUserProfile user={{ fullName: 'John Doe', role: 'Admin' }} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders user role', () => {
      render(<SidebarUserProfile user={{ fullName: 'John Doe', role: 'Admin' }} />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('renders labels for user info', () => {
      render(<SidebarUserProfile user={{ fullName: 'John Doe', role: 'Admin' }} />);
      expect(screen.getByText('Logged in as:')).toBeInTheDocument();
      expect(screen.getByText('Role:')).toBeInTheDocument();
    });
  });

  describe('Fallback values', () => {
    it('displays fallback when user is undefined', () => {
      render(<SidebarUserProfile user={undefined} />);
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    it('displays fallback when fullName is missing', () => {
      render(<SidebarUserProfile user={{ role: 'Admin' }} />);
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('displays fallback when role is missing', () => {
      render(<SidebarUserProfile user={{ fullName: 'John Doe' }} />);
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    it('displays fallback when user object is empty', () => {
      render(<SidebarUserProfile user={{}} />);
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });
  });

  describe('Different user roles', () => {
    it('renders manager role', () => {
      render(<SidebarUserProfile user={{ fullName: 'Jane Smith', role: 'Manager' }} />);
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });

    it('renders viewer role', () => {
      render(<SidebarUserProfile user={{ fullName: 'Bob Johnson', role: 'Viewer' }} />);
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('renders custom role', () => {
      render(<SidebarUserProfile user={{ fullName: 'Alice Brown', role: 'Warehouse Operator' }} />);
      expect(screen.getByText('Warehouse Operator')).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('uses common:loggedInAs translation key', () => {
      render(<SidebarUserProfile user={{ fullName: 'John Doe', role: 'Admin' }} />);
      expect(screen.getByText('Logged in as:')).toBeInTheDocument();
    });

    it('uses common:role translation key', () => {
      render(<SidebarUserProfile user={{ fullName: 'John Doe', role: 'Admin' }} />);
      expect(screen.getByText('Role:')).toBeInTheDocument();
    });
  });
});
