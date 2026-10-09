/**
 * @file zodConfig.ts
 * @module config/zodConfig
 *
 * @summary
 * Turns off zod's JIT compilation, so it never probes `new Function`.
 *
 * @enterprise
 * - The site sends a Content-Security-Policy without 'unsafe-eval'. zod
 *   probes for eval support when it builds an object schema; the probe
 *   catches the failure, but the browser still reports a CSP violation
 *   for it (FW6 CSP survey, 2026-10-09). With `jitless` set zod skips the
 *   probe and parses with its interpreter, which is fast enough for forms.
 * - zod reads the setting when a schema is constructed, so main.tsx
 *   imports this module first, before any module that defines a schema.
 */
import { z } from 'zod';

z.config({ jitless: true });
