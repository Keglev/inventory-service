/**
 * Test setup file for vitest
 * Extends Jest matchers with @testing-library/jest-dom and registers global stubs.
 */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Module: any = require('module');

const iconStub = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) =>
	React.createElement('svg', {
		...props,
		ref,
		role: 'img',
		'data-testid': 'mui-icon-stub',
	})
);

iconStub.displayName = 'MuiIconStub';

if (!(globalThis as { __MUI_ICON_PATCHED__?: boolean }).__MUI_ICON_PATCHED__) {
	(globalThis as { __MUI_ICON_PATCHED__?: boolean }).__MUI_ICON_PATCHED__ = true;
	const originalLoad = Module._load;
	Module._load = function patchedLoad(request: string, parent: NodeModule | undefined, isMain: boolean) {
		if (request && request.startsWith('@mui/icons-material/')) {
			return { __esModule: true, default: iconStub };
		}
		if (request === '@mui/icons-material') {
			return new Proxy(
				{},
				{
					get: () => iconStub,
				}
			);
		}
		return originalLoad.call(this, request, parent, isMain);
	};
}
