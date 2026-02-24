/**
 * @file setupTests.ts
 * @module __tests__/test/setupTests
 *
 * @description
 * Global Vitest test runtime setup.
 *
 * @responsibility
 * - Register jest-dom matchers for Vitest.
 * - Provide a deterministic stub for MUI icons to speed up tests and avoid ESM/CJS edge cases.
 *
 * @out_of_scope
 * - Per-test configuration (belongs in individual test files).
 * - Component-level mocks (belongs next to the test or in dedicated stubs/mocks folders).
 */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// We intentionally patch the Node module loader in the test environment only.
// This prevents importing hundreds of icon modules and avoids brittle module-resolution edge cases.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Module: any = require('module');

const iconStub = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) =>
  React.createElement('svg', {
    ...props,
    ref,
    role: 'img',
    'data-testid': 'mui-icon-stub',
  }),
);

iconStub.displayName = 'MuiIconStub';

// Guard to ensure we patch the loader only once (Vitest can evaluate setup more than once in some modes).
if (!(globalThis as { __MUI_ICON_PATCHED__?: boolean }).__MUI_ICON_PATCHED__) {
  (globalThis as { __MUI_ICON_PATCHED__?: boolean }).__MUI_ICON_PATCHED__ = true;

  const originalLoad = Module._load;

  // Patch `Module._load` so all `@mui/icons-material/*` imports resolve to a lightweight SVG stub.
  Module._load = function patchedLoad(request: string, parent: NodeModule | undefined, isMain: boolean) {
    if (request && request.startsWith('@mui/icons-material/')) {
      return { __esModule: true, default: iconStub };
    }
    if (request === '@mui/icons-material') {
      // Support both:
      //   import Icon from '@mui/icons-material/X'
      //   import * as Icons from '@mui/icons-material'
      return new Proxy({}, { get: () => iconStub });
    }
    return originalLoad.call(this, request, parent, isMain);
  };
}