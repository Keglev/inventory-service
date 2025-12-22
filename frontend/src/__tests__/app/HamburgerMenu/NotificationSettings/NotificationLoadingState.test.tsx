/**
 * @file NotificationLoadingState.test.tsx
 * @module __tests__/app/HamburgerMenu/NotificationSettings/NotificationLoadingState
 * @description Tests for notification loading state component.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import NotificationLoadingState from '../../../../app/HamburgerMenu/NotificationSettings/NotificationLoadingState';

describe('NotificationLoadingState', () => {
  it('renders loading skeleton', () => {
    const { container } = render(<NotificationLoadingState />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders two skeleton elements', () => {
    const { container } = render(<NotificationLoadingState />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBe(2);
  });

  it('renders text variant skeletons', () => {
    const { container } = render(<NotificationLoadingState />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-text');
    expect(skeletons.length).toBe(2);
  });
});
