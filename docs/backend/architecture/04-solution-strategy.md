# §4 Solution Strategy

## Layered Architecture

The backend is structured as four strict layers — controller, service, repository,
model — with dependency flowing downward only. Controllers route and serialise;
services own all business logic and transaction boundaries; repositories handle data
access; model classes are pure JPA entities with no business methods. No layer may
skip a level. This makes each layer independently testable and prevents business logic
from leaking into the HTTP boundary or the persistence boundary.

## JPA / Hibernate with Oracle Autonomous Database

Spring Data JPA with Hibernate provides the persistence abstraction. Repository
interfaces declare query intent via JPQL or native SQL (`@Query`); Hibernate handles
dialect differences between Oracle 23ai in production and H2 in Oracle-compatibility
mode for local development and CI. Audit fields (`createdBy`, `createdAt`) are set at
entity creation. There is no `@Version`/optimistic locking and no update-audit fields.

## DTO Boundary and Manual Mapping

JPA entities never cross the controller boundary; DTOs never enter repositories. This
decouples the API contract from the database schema so either can evolve independently.
Mapping is done by hand rather than with an annotation-processor framework, favouring
explicit conversions that are straightforward to read and trace under a debugger.
See [ADR 0002](09-decisions/adr-0002-manual-mapping-over-mapstruct.md) and
[ADR 0003](09-decisions/adr-0003-dto-boundary-no-entity-exposure.md).

## OAuth2 / RBAC Security

Authentication delegates to Google OAuth2 via the Authorization Code flow; the
backend exchanges the code server-to-server and issues an HTTP-only, `Secure`
session cookie — no token ever reaches the frontend. Authorisation is enforced at the
method level with `@PreAuthorize`; two roles (`ADMIN`, `USER`) cover all current
access-control requirements. The production database connection is passwordless via
Oracle wallet (`cwallet.sso`).
See [ADR 0001](09-decisions/adr-0001-oracle-wallet-autologin.md).

## HTTP Status as the Response Envelope

Endpoints return the domain object (or an empty body) directly with a meaningful HTTP
status code. There is no generic success wrapper. All errors share one canonical shape:
`{ "error": "<token>", "message": "...", "timestamp": "..." }` — plus an optional
`fieldErrors` map on bean-validation failures — produced by two `@ControllerAdvice`
classes (framework and domain exceptions) building the same `ErrorResponse` record,
so the contract cannot drift per endpoint.
See [ADR 0004](09-decisions/adr-0004-http-status-as-envelope.md).

## Stateless Services and Horizontal Scaling

No business state is held in memory between requests. Spring Security tracks the
authenticated principal via an HTTP-only cookie, but the backend itself treats every
request as self-contained. Additional instances can be added behind a load balancer
without sticky sessions or a shared cache — a constraint imposed by Fly.io's
single-instance-by-default deployment model that is satisfied at zero extra cost.
