# ADR-0016: TypeScript 7 waits until the linter and TypeDoc accept it

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-10-30

## Context
The frontend compiles with TypeScript 6.0.3. TypeScript 7.0.2 (released
2026-07-08) is the first release of the compiler rewritten in Go. The major
version survey of 2026-10-30 (F8) tried it on main `da365d4`:

- **The compiler itself is close to ready.** `tsc -b` with 7.0.2 reports one
  error over the whole tree: `useEmployeesSectionData.ts` line 64 (TS7053), an
  index write on a value whose type 7 infers from the `?? { period }` fallback
  on line 63. Annotating the variable as `EmployeesChartRow` removes it.
- **The tools that read the compiler are not.** Two gates load TypeScript as a
  library, not as a command:
  - ESLint's type-aware rules run through `typescript-eslint`. Its latest
    release (8.72.1) and its canary (8.72.2-alpha.4) declare the peer range
    `typescript >=4.8.4 <6.1.0`.
  - TypeDoc builds the published API pages from `src/api` and `src/context`
    and runs with `--treatWarningsAsErrors` in the docs build. Its latest
    release (0.28.20) declares `typescript` `5.0.x` to `6.0.x`.
- **The 7.0 package no longer carries the old library interface.** Its
  `exports` map offers the version (`.`) and `./unstable/*` entry points only,
  so neither tool can be pointed at it by hand.

Dependabot does not propose majors for npm (minor and patch only), so nothing
would raise this again on its own.

## Decision
TypeScript stays on 6.0.x. The move to 7 is a single later change, made when
both of these hold:

1. `npm view typescript-eslint peerDependencies.typescript` admits 7, and
2. `npm view typedoc peerDependencies.typescript` admits 7,

each in a release at least seven days old (the cooldown the dependency updates
use). That change bumps `typescript`, the two tools, fixes line 63 above (or
whatever `tsc -b` with 7 reports then) and runs every gate that reads the
compiler: `tsc -b`, ESLint, TypeDoc, Vitest and the production build.

## Alternatives Considered
- **TypeScript 7 next to 6, with 7 only for the type-check.** It would give 7's
  checks now. It costs a second compiler as a dependency, two answers to "does
  this type-check" that can disagree, and a migration done twice. Rejected:
  a new dependency for a small gain.
- **Drop the tools that block it** (type-aware lint rules, TypeDoc API pages).
  Rejected: both are gates the project relies on; the API pages are published.

## Consequences
- The F8 major-version wave ships without TypeScript 7; the other frontend
  majors (MUI 9, Data Grid 9, Vite 8, Vitest 5, jsdom 30, jest-dom 7) do not
  depend on it.
- `tsconfig.app.json` already avoids `baseUrl` (removed in 7), so the known
  config break is gone before the move.
- The check above is manual. It belongs to the next delta survey of outdated
  dependencies, which re-runs the two `npm view` commands.
- Line 63 of `useEmployeesSectionData.ts` stays as it is until the move: it is
  correct under 6, and changing it now would deploy the frontend for a compiler
  the project does not use.

## References
- [Frontend constraints](../02-constraints.md)
