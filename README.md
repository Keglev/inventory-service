# SmartSupplyPro

**Enterprise Inventory Management — Java 21 / Spring Boot 4.1 backend, React 19 / TypeScript frontend**

![CI Backend](https://github.com/Keglev/inventory-service/actions/workflows/1-ci-test.yml/badge.svg)
![CI Frontend](https://github.com/Keglev/inventory-service/actions/workflows/5-frontend-ci.yml/badge.svg)

Manual inventory tracking in small manufacturing companies leads to stock discrepancies, blind spots in purchasing, and slow decisions. SmartSupplyPro replaces that with a full-stack system for inventory, supplier, and stock-history management — built from real purchasing and production-planning experience, to enterprise standards: OAuth2 authentication, versioned database migrations, a documented REST API, bilingual UI (EN/DE), and a CI/CD pipeline with published test coverage.

**Live demo:** <https://inventory-service.koyeb.app> — click **Continue in Demo Mode** on the login page for read-only access with sample data. No account needed.

---

## Table of Contents

1. [Technical Highlights](#technical-highlights)
2. [Security](#security)
3. [Screenshots](#screenshots)
4. [Architecture & Documentation](#architecture--documentation)
5. [Tech Stack](#tech-stack)
6. [Quick Start](#quick-start)
7. [Testing & Code Quality](#testing--code-quality)
8. [CI/CD & Deployment](#cicd--deployment)
9. [Roadmap](#roadmap)
10. [Contact](#contact)

---

## Technical Highlights

- **Spring Boot 4.1 on Java 21** — migrated from Boot 3.5 / Java 17 (OpenRewrite-assisted), including the Jackson 3 port and JSpecify nullability annotations. The H2 test database is deliberately pinned to 2.3.232: Boot 4's managed 2.4.240 mis-validates Hibernate 7 converter CHECK constraints (h2database #4323) — the pin is documented and reversible.
- **Weighted Average Cost (WAC) financial analytics** — stock valuation and financial summaries are computed with WAC rather than FIFO, matching how small manufacturers actually report inventory value.
- **SAP-style soft delete with a zero-quantity gate** — inventory items are deactivated, never physically deleted; deletion is blocked (HTTP 409) until stock is zero, and the full stock history is retained as an append-only audit log.
- **Single-path OAuth2 provisioning** — Google login (OAuth2/OIDC) provisions users through one authoritative service: find-or-create plus role-healing on every token load, with an admin allow-list. No duplicated provisioning logic across the OAuth2 and OIDC flows.
- **Structured error contract** — all API errors return a consistent `{error, message, timestamp, fieldErrors?}` envelope from a layered `@ControllerAdvice` design (business handler ordered before the global handler, no type overlap).
- **Flyway-versioned Oracle schema** — production uses `ddl-auto: none`; Flyway owns the Oracle Autonomous Database schema end to end, connecting through wallet-based auto-login (no runtime wallet password).
- **Bilingual UI with strict i18n discipline** — full English/German localization with no in-code fallback strings; missing keys fail visibly instead of silently rendering English.
- **Client-side demo mode** — a read-only demo path that requires no backend account, so reviewers can evaluate the UI in one click.

---

## Security

- Google OAuth2 login with role-based access control (`ADMIN`, `USER`), enforced at method level via `@PreAuthorize` — not just at the route level.
- Session-based authentication with a cross-origin cookie (`SameSite=None; Secure`) — deliberately not JWT: the backend is an OAuth2 login client, not a resource server, so no tokens are exposed to the browser.
- Container images are scanned with Trivy in the CI pipeline before deployment.

Provisioning design and the structured error contract are covered under [Technical Highlights](#technical-highlights); the full login flow is documented in the [Security Concepts (arc42 §8)](./docs/backend/architecture/08-concepts.md) and [ADR-0007: Cross-Origin Auth Cookie](./docs/backend/architecture/09-decisions/adr-0007-cross-origin-auth-cookie.md).

---

## Screenshots

<img src="./frontend/src/assets/project-image.png" alt="Analytics dashboard overview" width="600" height="300"/>

<img src="./frontend/src/assets/barchart.png" alt="Monthly stock movement bar chart" width="600" height="300"/>

---

## Architecture & Documentation

- [Documentation Hub](https://keglev.github.io/inventory-service/) — landing page for all published docs
- [Backend Architecture (arc42)](https://keglev.github.io/inventory-service/backend/architecture/overview.html) — layering, security concepts, deployment, and architecture decision records
- [Frontend Architecture](https://keglev.github.io/inventory-service/frontend/architecture/overview.html) — SPA shell, routing, state management, and design system
- [API Reference (ReDoc)](https://keglev.github.io/inventory-service/backend/api/index.html) — interactive OpenAPI documentation
- [Security Concepts (arc42 §8)](./docs/backend/architecture/08-concepts.md) — OAuth2 authorization-code flow, session cookie strategy, role enforcement
- [Building Blocks (arc42 §5)](./docs/backend/architecture/05-building-blocks.md) — layer structure and per-service responsibilities, including the WAC analytics design

---

## Tech Stack

**Backend**
- Java 21, Spring Boot 4.1 (Spring Security, Spring Session, Spring Data JPA)
- Oracle Autonomous Database (Always Free tier, wallet authentication)
- Flyway migrations, Jackson 3, Lombok
- JUnit 5, Mockito, JaCoCo

**Frontend**
- React 19, TypeScript, Vite
- Material-UI (MUI), TanStack Query, React Hook Form + Zod
- react-i18next (EN/DE), Recharts
- Vitest, React Testing Library, TypeDoc

**DevOps & Infrastructure**
- GitHub Actions (numbered workflow pipeline: CI test, Docker build with Trivy scan, docs, deploy)
- Docker multi-stage builds
- Fly.io (backend), Koyeb (frontend), GitHub Pages (docs + coverage)

---

## Quick Start

Prerequisites: **JDK 21**, **Node 20+**, **Docker** (optional, for containerized runs).

```bash
# Backend (requires an Oracle ADB wallet + Google OAuth2 client; see note below)
./mvnw spring-boot:run

# Backend tests (run on an in-memory H2 database, no Oracle needed)
./mvnw test

# Frontend
cd frontend
npm install
npm run dev        # development server
npm run build      # production build
npx vitest run     # test suite
```

> **Note:** a full local backend run needs your own Oracle Autonomous Database wallet
> (`TNS_ADMIN` pointing to the wallet directory) and a Google OAuth2 client ID.
> The fastest way to evaluate the application is the [live demo](https://inventory-service.koyeb.app)
> in demo mode — no setup required.

---

## Testing & Code Quality

- **Backend:** 589 tests — JUnit 5 + Mockito unit tests, `@WebMvcTest` controller slices with Spring Security integration, `@DataJpaTest` persistence tests on H2 in Oracle compatibility mode.
- **Frontend:** 1,319 tests across 225 files — Vitest + React Testing Library, covering components, hooks, API fetchers, and i18n key resolution in both locales. Line coverage: ~86%.
- **Coverage** is generated on every CI build and published:
  - [Backend coverage (JaCoCo)](https://keglev.github.io/inventory-service/backend/coverage/index.html)
  - [Frontend coverage (Vitest)](https://keglev.github.io/inventory-service/frontend/coverage/index.html)
  - [Testing concepts (arc42 §8c)](./docs/backend/architecture/08c-concepts-testing.md)

---

## CI/CD & Deployment

Each push to `main` runs the numbered GitHub Actions pipeline: build and test both stacks, generate and publish coverage, build the backend Docker image with a Trivy security scan, and deploy.

- **Frontend:** fully automated — push to `main` builds and deploys to Koyeb with health checks.
- **Backend:** deliberately uses a manually triggered `fly deploy`. Oracle's Always Free tier requires IP whitelisting for database connections; building locally uses the whitelisted IP and the Fly.io VM provides a stable production IP, eliminating daily whitelist churn.

**Live application:** <https://inventory-service.koyeb.app>
**Backend API:** <https://inventoryservice.fly.dev>

---

## Roadmap

- Event-driven stock updates: publish stock-change events to Kafka behind a feature flag, with a Testcontainers-verified consumer (architecture decision record to follow).
- Frontend architecture documentation aligned to the arc42 format already used for the backend.

---

## Contact

Questions or suggestions: [open an issue](https://github.com/Keglev/inventory-service/issues).
