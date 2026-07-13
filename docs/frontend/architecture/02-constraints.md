# §2 Constraints

## Technical Constraints

| Component | Technology | Version |
|---|---|---|
| Language | TypeScript (strict) | 6.x |
| UI framework | React | 19.1 |
| Build tool | Vite | 7.x |
| Component library | MUI (Material UI) + Emotion | 7.x |
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
| Size standard | Code-line caps per layer (hard cap 300 lines/file, 50 lines/method, counting code lines only); measured, with documented waivers where a split would be artificial |
| Comments | Four-tag JSDoc headers (`@file`/`@module`/`@summary`/`@enterprise`); inline comments explain WHY, never WHAT; ASCII-only outside German legal content |
| Errors | The API layer tolerates and maps the backend's structured error envelope `{error, message, timestamp, fieldErrors?}` to user-friendly messages |
