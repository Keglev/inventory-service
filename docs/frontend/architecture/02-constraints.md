# §2 Constraints

## Technical Constraints

| Component | Technology | Version |
|---|---|---|
| Language | TypeScript (strict) | 6.x |
| UI framework | React | 19.1 |
| Build tool | Vite | 7.x |
| Component library | MUI (Material UI) | 7.x |
| CSS-in-JS | Emotion | 11.x |
| Server state | TanStack React Query | 5.x |
| HTTP client | Axios | 1.x |
| Routing | React Router | 7.x |
| Forms & validation | React Hook Form + Zod | current |
| Localization | i18next / react-i18next | current |
| Charts | Recharts | current |
| Testing | Vitest + React Testing Library | 4.x |
| Runtime (dev) | Node.js | 24+ |

The frontend is deployed as a static build behind Nginx on Koyeb; it has no server
runtime of its own. All data comes from the Spring Boot backend on Fly.io
(see [§3](03-context.md)).

## Organizational Constraints

This is a solo-developer portfolio project. Consequences:

- The developer owns UI, API integration, tests, CI, and deployment end to end.
- Decisions favour explicitness and long-term readability over abstraction layers
  that pay off only for large teams (see [ADR-0002](09-decisions/adr-0002-api-layer-abstraction-httpclient-and-domain-modules.md)).

## Conventions

| Convention | Rule |
|---|---|
| i18n | No in-code English fallback strings; missing keys are added to BOTH `public/locales/en` and `/de`. The EN JSON is the typing source (`resources.d.ts`) |
| Tests | Centralized under `frontend/src/__tests__/` (not co-located); documented by name; one canonical header dialect |
| Size standard | Per-layer code-line budgets (table below), measured by AST over code lines only; documented waivers where a split would be artificial |
| Comments | Four-tag JSDoc headers (`@file`/`@module`/`@summary`/`@enterprise`); inline comments explain WHY, never WHAT; ASCII-only outside German legal content |
| Errors | The API layer tolerates and maps the backend's structured error envelope `{error, message, timestamp, fieldErrors?}` to user-friendly messages |

## Size Budgets

Sizes are measured per file and per function over **code lines only** — blank lines
and comments are excluded, and the test tree is not measured. Two thresholds per
layer: the **band** is the shape a unit of that kind normally takes, and the
**alarm** is the gate. Exceeding the band is a signal to look; exceeding the alarm
requires either a split or a waiver recorded in
[§11](11-risks-technical-debt.md).

| Layer | Band | Alarm |
|---|---|---|
| Components | 40-100 | > 150 |
| Dialogs | 50-120 | > 160 |
| Hooks & handlers | 30-80 | > 120 |
| Context providers | 40-90 | > 120 |
| Page orchestrators | 60-140 | > 180 |
| API fetchers | file <= 150 | function <= 40 |
| Theme & config | 50-100 | > 150 |
| Utilities | 20-80 | > 120 |
| Any file | — | hard cap 300 |

There is deliberately **no blanket per-method cap**. A single figure cannot govern
both a React component, whose body is largely JSX, and a pure utility function; the
budgets are per layer for that reason.
