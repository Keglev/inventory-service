# §1 Introduction & Goals

## Purpose

Smart Supply Pro's backend is a Spring Boot service handling supplier relationships,
inventory tracking, and real-time stock analytics. It exposes a RESTful API consumed
by the React frontend, backed by Oracle Autonomous Database 23ai, and secured through
Google OAuth2 with role-based access control (RBAC).

## Quality Goals

| Priority | Quality Goal | Scenario |
|---|---|---|
| 1 | Security | Every endpoint requires a valid OAuth2 token; admin operations additionally require the `ADMIN` role enforced via `@PreAuthorize` at the controller boundary |
| 2 | Maintainability | Each concept has exactly one home — controllers route, services decide, repositories persist; cross-layer leakage is a build-time error |
| 3 | Separation of concerns | DTO boundary enforced at all controller boundaries; JPA entities never leave the service layer; DTOs never reach repositories |
| 4 | Testability | Constructor injection and repository abstraction allow service-layer unit tests without a live Spring context or database |
| 5 | Correctness | Three-tier validation (DTO annotations, service business rules, database constraints) ensures no invalid state can be persisted |

## Stakeholders

| Role | Interest |
|---|---|
| End users (`USER` role) | Reliable inventory viewing and basic stock operations; responsive API with meaningful error messages |
| Administrators (`ADMIN` role) | Full CRUD over suppliers and inventory items; access to analytics and financial summary reports |
| Developers | Clear layer boundaries, documented architectural decisions, and a test suite that catches regressions before deployment |

## Sections

| Section | Topic |
|---|---|
| [§2 Constraints](02-constraints.md) | Java 17, Spring Boot 3.5.x, Oracle 23ai, Maven, Docker; solo-dev and REST conventions |
| [§3 Context & Scope](03-context.md) | Business context, external systems (React frontend, Oracle ADB, Google OAuth2), C4 L1 diagram |
| [§4 Solution Strategy](04-solution-strategy.md) | Key strategic choices and the ADRs that justify each one |
| [§5 Building Block View](05-building-blocks.md) | Layer breakdown — controller, service, repository, model — logical-architecture and ER diagrams |
| [§6 Runtime View](06-runtime.md) | Request lifecycle, OAuth2 login flow, and analytics computation as sequence diagrams |
| [§7 Deployment View](07-deployment.md) | Fly.io topology, GitHub Actions CI/CD pipeline, Docker image strategy, environment secrets |
| [§8 Cross-cutting Concepts](08-concepts.md) | Security, validation, exception handling, configuration profiles, persistence audit fields (`createdBy`, `createdAt`) |
| [§9 Decisions](09-decisions/index.md) | Architecture Decision Records |
| [§10 Quality Requirements](10-quality.md) | Test strategy, JaCoCo coverage gates, CI pipeline, Trivy CVE scan |
| [§11 Risks & Technical Debt](11-risks.md) | Known risks, upcoming EOLs, and named technical debt |
| [§12 Glossary](12-glossary.md) | Domain and technical terms |
