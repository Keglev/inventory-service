/**
 * @file HelpPanel.test.tsx
 * @module __tests__/components/help/HelpPanel
 * @description
 * Enterprise test suite for the HelpPanel drawer:
 * - Verifies visibility rules (open/closed, valid/invalid topic)
 * - Verifies content rendering (title/body/link + footer hint)
 * - Verifies user interaction (close button triggers closeHelp)
 *
 * Notes:
 * - We mock `useHelp` to fully control open state + selected topic ID.
 * - We mock the help topic registry as a pure lookup to keep tests deterministic.
 * - We mock i18n to return keys, making assertions stable and language-agnostic.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HelpPanel from '@/components/help/HelpPanel';

// -----------------------------------------------------------------------------
// Hoisted mocks (created once, reused safely across tests)
// -----------------------------------------------------------------------------

const mockCloseHelp = vi.hoisted(() => vi.fn());
const mockOpenHelp = vi.hoisted(() => vi.fn());

const mockUseHelp = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useHelp', () => ({
  useHelp: mockUseHelp,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Returning the key keeps assertions stable across languages.
    t: (key: string) => key,
  }),
}));

vi.mock('@/help/topics', () => ({
  // Registry mock: minimal topic definitions required for this component.
  getHelpTopic: (id: string) => {
    if (id === 'test.topic') {
      return {
        id: 'test.topic',
        titleKey: 'help:test.title',
        bodyKey: 'help:test.body',
        linkKey: 'help:test.link',
        category: 'general',
      };
    }

    if (id === 'no.link') {
      return {
        id: 'no.link',
        titleKey: 'help:nolink.title',
        bodyKey: 'help:nolink.body',
        category: 'general',
      };
    }

    return undefined;
  },
}));

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type HelpHookState = {
  currentTopicId: string | null;
  isOpen: boolean;
  closeHelp: () => void;
  openHelp: () => void;
};

function arrangeHelpState(overrides: Partial<HelpHookState> = {}): HelpHookState {
  // Centralizes defaults so each test changes only what matters for the scenario.
  return {
    currentTopicId: 'test.topic',
    isOpen: true,
    closeHelp: mockCloseHelp,
    openHelp: mockOpenHelp,
    ...overrides,
  };
}

function setup(overrides: Partial<HelpHookState> = {}) {
  mockUseHelp.mockReturnValue(arrangeHelpState(overrides));
  return render(<HelpPanel />);
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('HelpPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed or no topic is selected', () => {
    setup({ isOpen: false, currentTopicId: null });

    // The drawer should not exist at all when help is not active.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders drawer with title and body when open with a valid topic', () => {
    setup({ isOpen: true, currentTopicId: 'test.topic' });

    expect(screen.getByText('help:test.title')).toBeInTheDocument();
    expect(screen.getByText('help:test.body')).toBeInTheDocument();
  });

  it('calls closeHelp when the user clicks the close button', async () => {
    setup({ isOpen: true, currentTopicId: 'test.topic' });
    const user = userEvent.setup();

    // We scope to the dialog so we don't accidentally click unrelated buttons.
    const dialog = screen.getByRole('dialog');

    // If the component doesn't provide an accessible name for the close button,
    // we fall back to selecting the first button in the dialog header area.
    // (Prefer adding an aria-label in the component long-term.)
    const header = within(dialog).getByText('help:test.title').closest('div');
    expect(header).not.toBeNull();

    const [closeButton] = within(header as HTMLElement).getAllByRole('button');
    await user.click(closeButton);

    expect(mockCloseHelp).toHaveBeenCalledTimes(1);
  });

  it('renders the optional link section when linkKey is present', () => {
    setup({ currentTopicId: 'test.topic' });

    expect(screen.getByText('help:test.link')).toBeInTheDocument();
  });

  it('does not render a link section when linkKey is absent', () => {
    setup({ currentTopicId: 'no.link' });

    expect(screen.queryByText('help:test.link')).not.toBeInTheDocument();
  });

  it('renders the footer close hint text', () => {
    setup({ currentTopicId: 'test.topic' });

    expect(screen.getByText('help:general.closeHint')).toBeInTheDocument();
  });

  it('renders nothing when the topic ID is invalid (registry miss)', () => {
    setup({ currentTopicId: 'invalid.topic', isOpen: true });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('accepts width and position props without breaking rendering', () => {
    mockUseHelp.mockReturnValue(arrangeHelpState({ currentTopicId: 'test.topic', isOpen: true }));

    const { rerender } = render(<HelpPanel width={500} position="left" />);
    expect(screen.getByText('help:test.title')).toBeInTheDocument();

    // Re-rendering with different props is a lightweight regression check that
    // layout options are wired and do not affect content visibility.
    rerender(<HelpPanel width={300} position="right" />);
    expect(screen.getByText('help:test.title')).toBeInTheDocument();
  });
});
