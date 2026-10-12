/**
 * @file NotificationLoadingState.test.tsx
 * @module __tests__/app/layout/header/notifications
 *
 * @description
 * Unit tests for <NotificationLoadingState /> — skeleton UI displayed while notification
 * data is loading.
 *
 * Test strategy:
 * - Verify MUI Skeleton elements render.
 * - Verify the expected number of skeleton rows are shown (two).
 * - Verify skeleton variant is "text" (matches the intended placeholder UX).
 *
 * Notes:
 * - We use MUI class hooks here because the component's purpose is purely presentational.
 * - If you ever change the skeleton layout (e.g., add a third row), update the counts.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import NotificationLoadingState from '@/app/layout/header/notifications/NotificationLoadingState';

describe('NotificationLoadingState', () => {
  /**
   * Arrange helper: render once per test to keep queries consistent and explicit.
   */
  const arrange = () => render(<NotificationLoadingState />);

  it('renders skeleton placeholders', () => {
    const { container } = arrange();
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('renders exactly two skeleton rows', () => {
    const { container } = arrange();
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(2);
  });

  it('renders text-variant skeletons', () => {
    const { container } = arrange();
    expect(container.querySelectorAll('.MuiSkeleton-text')).toHaveLength(2);
  });
});
