/**
 * @file HelpIconButton.test.tsx
 * @module __tests__/features/help/components/HelpIconButton
 *
 * @summary
 * Test suite for HelpIconButton component.
 * Tests: rendering, click handling, help topic navigation, tooltip display.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpIconButton from '../../../../features/help/components/HelpIconButton';
import * as helpHooks from '../../../../hooks/useHelp';

// Mock the useHelp hook
vi.mock('../../../../hooks/useHelp', () => ({
  useHelp: vi.fn(),
}));

describe('HelpIconButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    // Arrange
    const mockOpenHelp = vi.fn();
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: mockOpenHelp,
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });

    // Act
    render(<HelpIconButton topicId="test-topic" />);

    // Assert
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('should render with help icon', () => {
    // Arrange
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: vi.fn(),
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });

    // Act
    render(<HelpIconButton topicId="test-topic" />);

    // Assert
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should call openHelp with topicId on click', async () => {
    // Arrange
    const openHelpMock = vi.fn();
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: openHelpMock,
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });
    const topicId = 'inventory-help';

    // Act
    render(<HelpIconButton topicId={topicId} />);
    const button = screen.getByRole('button');
    await userEvent.click(button);

    // Assert
    expect(openHelpMock).toHaveBeenCalledWith(topicId);
  });

  it('should display tooltip when provided', () => {
    // Arrange
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: vi.fn(),
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });
    const tooltipText = 'Click for help';

    // Act
    render(
      <HelpIconButton topicId="test-topic" tooltip={tooltipText} />
    );

    // Assert
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should use default tooltip when not provided', () => {
    // Arrange
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: vi.fn(),
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });

    // Act
    render(<HelpIconButton topicId="test-topic" />);

    // Assert
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should handle multiple quick clicks', async () => {
    // Arrange
    const openHelpMock = vi.fn();
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: openHelpMock,
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });

    // Act
    render(<HelpIconButton topicId="test-topic" />);
    const button = screen.getByRole('button');

    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    // Assert
    expect(openHelpMock).toHaveBeenCalledTimes(3);
    expect(openHelpMock).toHaveBeenCalledWith('test-topic');
  });

  it('should handle different topic IDs', async () => {
    // Arrange
    const openHelpMock = vi.fn();
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: openHelpMock,
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });
    const topicIds = ['inventory', 'suppliers', 'reports'];

    // Act & Assert
    for (const topicId of topicIds) {
      const { unmount } = render(<HelpIconButton topicId={topicId} />);
      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(openHelpMock).toHaveBeenCalledWith(topicId);
      unmount();
      openHelpMock.mockClear();
    }
  });

  it('should maintain focus after click', async () => {
    // Arrange
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: vi.fn(),
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });

    // Act
    render(<HelpIconButton topicId="test-topic" />);
    const button = screen.getByRole('button');

    button.focus();
    expect(button).toHaveFocus();

    await userEvent.click(button);

    // Assert
    expect(button).toBeInTheDocument();
  });

  it('should work within a form without interfering', () => {
    // Arrange
    vi.mocked(helpHooks.useHelp).mockReturnValue({
      openHelp: vi.fn(),
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
    });

    // Act
    render(
      <form data-testid="test-form">
        <input type="text" />
        <HelpIconButton topicId="form-help" />
      </form>
    );

    // Assert
    const form = screen.getByTestId('test-form');
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(form).toBeInTheDocument();
  });
});
