import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import HelpPanel from '@/components/help/HelpPanel';

// Verifies help panel rendering, translations, and user interactions.

// Mock the help hook to control state.
const mockCloseHelp = vi.fn();
vi.mock('@/hooks/useHelp', () => ({
  useHelp: vi.fn(),
}));

// Mock i18n translation.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock the help topics registry.
vi.mock('@/help/topics', () => ({
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

import { useHelp } from '@/hooks/useHelp';

const mockUseHelp = useHelp as unknown as ReturnType<typeof vi.fn>;

describe('HelpPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCloseHelp.mockClear();
  });

  it('renders nothing when not open or no topic selected', () => {
    mockUseHelp.mockReturnValue({
      currentTopicId: null,
      isOpen: false,
      closeHelp: mockCloseHelp,
      openHelp: vi.fn(),
    });

    render(<HelpPanel />);

    // Verify drawer is not rendered when help panel is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders drawer with topic content when open', () => {
    mockUseHelp.mockReturnValue({
      currentTopicId: 'test.topic',
      isOpen: true,
      closeHelp: mockCloseHelp,
      openHelp: vi.fn(),
    });

    render(<HelpPanel />);

    expect(screen.getByText('help:test.title')).toBeInTheDocument();
    expect(screen.getByText('help:test.body')).toBeInTheDocument();
  });

  it('renders close button that triggers closeHelp callback', () => {
    mockUseHelp.mockReturnValue({
      currentTopicId: 'test.topic',
      isOpen: true,
      closeHelp: mockCloseHelp,
      openHelp: vi.fn(),
    });

    render(<HelpPanel />);

    const header = screen.getByText('help:test.title').closest('div');
    const closeButton = within(header!).getAllByRole('button')[0];
    fireEvent.click(closeButton);

    expect(mockCloseHelp).toHaveBeenCalledTimes(1);
  });

  it('renders optional link section when linkKey is present', () => {
    mockUseHelp.mockReturnValue({
      currentTopicId: 'test.topic',
      isOpen: true,
      closeHelp: mockCloseHelp,
      openHelp: vi.fn(),
    });

    render(<HelpPanel />);

    expect(screen.getByText('help:test.link')).toBeInTheDocument();
  });

  it('does not render link section when linkKey is absent', () => {
    mockUseHelp.mockReturnValue({
      currentTopicId: 'no.link',
      isOpen: true,
      closeHelp: mockCloseHelp,
      openHelp: vi.fn(),
    });

    render(<HelpPanel />);

    expect(screen.queryByText('help:test.link')).not.toBeInTheDocument();
  });

  it('renders close hint text in footer', () => {
    mockUseHelp.mockReturnValue({
      currentTopicId: 'test.topic',
      isOpen: true,
      closeHelp: mockCloseHelp,
      openHelp: vi.fn(),
    });

    render(<HelpPanel />);

    expect(screen.getByText('help:general.closeHint')).toBeInTheDocument();
  });

  it('does not render when topic ID is invalid', () => {
    mockUseHelp.mockReturnValue({
      currentTopicId: 'invalid.topic',
      isOpen: true,
      closeHelp: mockCloseHelp,
      openHelp: vi.fn(),
    });

    render(<HelpPanel />);

    // Verify drawer is not rendered when topic ID doesn't exist
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('accepts custom width and position props', () => {
    mockUseHelp.mockReturnValue({
      currentTopicId: 'test.topic',
      isOpen: true,
      closeHelp: mockCloseHelp,
      openHelp: vi.fn(),
    });

    const { rerender } = render(<HelpPanel width={500} position="left" />);

    expect(screen.getByText('help:test.title')).toBeInTheDocument();

    rerender(<HelpPanel width={300} position="right" />);

    expect(screen.getByText('help:test.title')).toBeInTheDocument();
  });
});
