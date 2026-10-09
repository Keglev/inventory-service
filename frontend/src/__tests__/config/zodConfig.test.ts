/**
 * @file zodConfig.test.ts
 * @module __tests__/config/zodConfig
 * @testing Vitest
 * @description Pins the global zod setting that keeps the eval probe, and the
 * CSP report it causes, out of the browser.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import '@/config/zodConfig';

describe('zodConfig', () => {
  it('turns zod JIT compilation off when imported', () => {
    expect(z.config().jitless).toBe(true);
  });
});
