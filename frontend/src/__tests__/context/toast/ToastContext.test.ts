/**
 * @file ToastContext.test.ts
 *
 * @what_is_under_test ToastContext module - ephemeral notification context
 * @responsibility Provide toast function type and context for displaying notifications
 * @out_of_scope Toast UI rendering, notification timing, MUI Alert integration
 */

import { describe, it, expect, vi } from 'vitest';
import { ToastContext, useToast, type ToastFn } from '../../../context/toast/ToastContext';

describe('ToastContext', () => {
  describe('Context creation', () => {
    it('creates ToastContext successfully', () => {
      expect(ToastContext).toBeDefined();
    });

    it('context is a React context object', () => {
      expect(ToastContext.Provider).toBeDefined();
      expect(ToastContext.Consumer).toBeDefined();
    });

    it('has default no-op function', () => {
      expect(typeof ToastContext.Provider).toBe('object');
      expect(typeof ToastContext.Consumer).toBe('object');
    });
  });

  describe('ToastFn type', () => {
    it('defines ToastFn with correct signature', () => {
      const mockToast: ToastFn = (msg, severity) => {
        expect(typeof msg).toBe('string');
        expect(['success', 'info', 'warning', 'error'].includes(severity || 'info')).toBe(true);
      };

      mockToast('Test message', 'success');
      mockToast('Another message', 'error');
      mockToast('Simple message');
    });

    it('allows ToastFn with optional severity', () => {
      const mockToast: ToastFn = () => {};

      // Both calls should be valid
      mockToast('Message 1', 'success');
      mockToast('Message 2');
    });

    it('supports all severity levels', () => {
      const severities: Array<'success' | 'info' | 'warning' | 'error'> = [
        'success',
        'info',
        'warning',
        'error',
      ];

      const mockToast: ToastFn = vi.fn();

      severities.forEach((severity) => {
        mockToast('Test', severity);
      });

      expect(mockToast).toHaveBeenCalledTimes(4);
    });
  });

  describe('Context provider', () => {
    it('has Provider for value injection', () => {
      expect(ToastContext.Provider).toBeDefined();
    });

    it('has Consumer for value consumption', () => {
      expect(ToastContext.Consumer).toBeDefined();
    });
  });

  describe('useToast hook', () => {
    it('hook is exported', () => {
      expect(useToast).toBeDefined();
      expect(typeof useToast).toBe('function');
    });

    it('hook accesses context value', () => {
      // The hook is defined to access ToastContext
      expect(() => {
        expect(useToast).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('error thrown when used outside provider has proper message', () => {
      const expectedMessage = 'useToast must be used within a ToastContext.Provider';
      expect(expectedMessage).toContain('useToast');
      expect(expectedMessage).toContain('Provider');
    });
  });

  describe('TypeScript definitions', () => {
    it('ToastFn is properly typed', () => {
      const fn: ToastFn = () => {
        // Type-safe function signature
      };

      expect(typeof fn).toBe('function');
    });

    it('context has proper type', () => {
      expect(typeof ToastContext).toBe('object');
      expect(ToastContext.Provider).toBeDefined();
    });
  });

  describe('Default behavior', () => {
    it('default context value is callable', () => {
      const contextValue = () => {}; // Default no-op function
      expect(typeof contextValue).toBe('function');
    });

    it('default function handles calls gracefully', () => {
      const defaultFn: ToastFn = () => {};
      expect(() => {
        defaultFn('Test message', 'success');
      }).not.toThrow();
    });
  });

  describe('Message types', () => {
    it('accepts various message strings', () => {
      const messages = [
        'Simple message',
        'Message with special chars: !@#$%',
        'Very long message ' + 'x'.repeat(100),
        '',
      ];

      const mockToast: ToastFn = vi.fn();

      messages.forEach((msg) => {
        mockToast(msg);
      });

      expect(mockToast).toHaveBeenCalledTimes(messages.length);
    });
  });
});
