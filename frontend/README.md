# SmartSupplyPro — Frontend

Single-page application for the SmartSupplyPro inventory management system.
Part of the [inventory-service](https://github.com/Keglev/inventory-service)
monorepo; see the repository root README for the full-stack overview and the
[architecture documentation](https://keglev.github.io/inventory-service/) for
design detail.

## Stack

- React 19 + TypeScript 6
- Vite 8 (build and dev server)
- MUI 9 and MUI X Data Grid 9 (component library, theming, grids)
- TanStack Query 5 (server state)
- React Router 7 (routing)
- Axios (HTTP client)
- react-i18next (English and German; German is the default display language)
- Vitest 5 + Testing Library (unit and component tests); Playwright (browser suite in CI)

Requires Node >= 24.

## Getting started

Install dependencies and start the dev server:

    npm install
    npm run dev

The dev server proxies `/api`, `/oauth2` and `/logout` to a local backend on
`http://localhost:8081`; set `DEV_PROXY_TARGET` (shell or `.env` file) to point it
at another backend instance.

## Scripts

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) and produce a production build
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint
- `npm test` — run the Vitest suite
- `npm run docs` — generate the TypeDoc API reference

## Testing and coverage

Tests run on Vitest with Testing Library. The coverage report is published
automatically and available at
[the coverage site](https://keglev.github.io/inventory-service/frontend/coverage/).

## Deployment

The frontend deploys to Koyeb automatically on push to `main`. The live
application is at <https://www.smartsupplypro.de>.

## License

Released under the [MIT License](../LICENSE).
