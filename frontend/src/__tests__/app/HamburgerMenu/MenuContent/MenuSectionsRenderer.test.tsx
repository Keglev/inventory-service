/**
 * @file MenuSectionsRenderer.test.tsx
 * @module __tests__/app/HamburgerMenu/MenuContent
 * @testing Vitest + React Testing Library; section components mocked as marker text
 * @description
 * Unit tests for <MenuSectionsRenderer /> — the user menu body (FW5 fork 1).
 *
 * Contract:
 * - Renders profile, the Settings entry, help links and system info, in that order.
 * - Holds no preference editors (appearance, language) and no notifications.
 * - The Settings entry closes the menu, then opens the settings dialog.
 * - Clicking inside a section closes the menu; sections receive no props.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tEn } from '@/__tests__/test/i18nEn';
import MenuSectionsRenderer from '@/app/HamburgerMenu/MenuContent/MenuSectionsRenderer';

const mockProfileMenuSection = vi.hoisted(() => vi.fn(() => <div>Profile Section</div>));
const mockHelpDocsMenuSection = vi.hoisted(() => vi.fn(() => <div>Help Section</div>));
const mockSystemInfoMenuSection = vi.hoisted(() => vi.fn(() => <div>System Info Section</div>));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));
vi.mock('@/app/HamburgerMenu/ProfileMenuSection', () => ({ default: mockProfileMenuSection }));
vi.mock('@/app/HamburgerMenu/HelpDocsMenuSection', () => ({ default: mockHelpDocsMenuSection }));
vi.mock('@/app/HamburgerMenu/SystemInfoMenuSection', () => ({ default: mockSystemInfoMenuSection }));

describe('MenuSectionsRenderer', () => {
  const onSettingsOpen = vi.fn();
  const onClose = vi.fn();

  const arrange = () => render(<MenuSectionsRenderer onSettingsOpen={onSettingsOpen} onClose={onClose} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile, settings entry, help and system info', () => {
    arrange();
    expect(screen.getByText('Profile Section')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Settings…' })).toBeInTheDocument();
    expect(screen.getByText('Help Section')).toBeInTheDocument();
    expect(screen.getByText('System Info Section')).toBeInTheDocument();
  });

  it('renders no preference editors and no notifications', () => {
    arrange();
    // Section markers of the removed blocks, and their translated headings.
    expect(screen.queryByText(/Appearance|Language|Notifications/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
  });

  it('closes the menu and then opens the settings dialog when Settings is clicked', async () => {
    const user = userEvent.setup();
    arrange();
    await user.click(screen.getByRole('menuitem', { name: 'Settings…' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSettingsOpen).toHaveBeenCalledTimes(1);
    expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(onSettingsOpen.mock.invocationCallOrder[0]);
  });

  it.each(['Profile Section', 'Help Section', 'System Info Section'])(
    'closes the menu when %s is clicked',
    async (marker) => {
      const user = userEvent.setup();
      arrange();
      await user.click(screen.getByText(marker));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSettingsOpen).not.toHaveBeenCalled();
    },
  );

  it('renders the sections without props', () => {
    arrange();
    expect(mockProfileMenuSection).toHaveBeenCalledWith({}, undefined);
    expect(mockHelpDocsMenuSection).toHaveBeenCalledWith({}, undefined);
    expect(mockSystemInfoMenuSection).toHaveBeenCalledWith({}, undefined);
  });

  it('renders the blocks in the order profile, settings, help, system info', () => {
    arrange();
    const text = document.body.textContent ?? '';
    const positions = ['Profile Section', 'Settings…', 'Help Section', 'System Info Section'].map((m) => text.indexOf(m));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
