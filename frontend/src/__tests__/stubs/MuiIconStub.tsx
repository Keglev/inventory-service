/**
 * @file MuiIconStub.tsx
 * @description Test stub for MUI SVG icon components.
 *
 * Purpose:
 * - Replace heavy/implementation-specific icon components during unit tests.
 * - Provide a stable, queryable element for assertions (`role="img"`, `data-testid`).
 *
 * Contract under test:
 * - Renders an `<svg>` element.
 * - Forwards the ref to the underlying `<svg>`.
 * - Passes through all SVG props so consumers can set `aria-*`, `className`, etc.
 *
 * Out of scope:
 * - Any real icon paths/graphics.
 * - Styling, theming, or MUI-specific behavior.
 */

import { forwardRef } from 'react';
import type { SVGProps } from 'react';

const MuiIconStub = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  // Keep this minimal and stable: tests should not depend on SVG internals.
  <svg ref={ref} role="img" data-testid="mui-icon-stub" {...props} />
));

// Named displayName helps React DevTools and improves debug output when tests fail.
MuiIconStub.displayName = 'MuiIconStub';

export default MuiIconStub;
