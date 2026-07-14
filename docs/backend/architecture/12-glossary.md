# Glossary

Domain, technical, and infrastructure terms used across this documentation, defined
in the context of SmartSupplyPro. Cross-references point to the section or decision
where a term is treated in depth.

| Term | Definition |
|------|------------|
| ADB (Oracle Autonomous Database) | Managed Oracle 23ai database backing the `prod` profile; reached via the wallet. See [ADR-0001](./09-decisions/adr-0001-oracle-wallet-autologin.md) |
| ADR | Architecture Decision Record — a decision with its justification and rejected alternatives. See [§9](./09-decisions/index.md) |
| AnalyticsService | Service computing stock valuation and trends using Weighted Average Cost (WAC) |
| AppUser | JPA entity for an authenticated user; carries the assigned role |
| arc42 | The documentation template structuring this architecture (§1–§12) |
| BusinessExceptionHandler | `@ControllerAdvice` mapping domain exceptions to HTTP status: `InvalidRequest` → 400, `Duplicate` / `IllegalState` → 409 |
| `cwallet.sso` | Oracle auto-login wallet file (part of a downloaded wallet archive). Production opens the wallet in encrypted form with a runtime wallet password instead. See [ADR-0009](./09-decisions/adr-0009-runtime-wallet-delivery.md) |
| DTO (Data Transfer Object) | The only object types that cross the controller boundary; 16 in the `dto/` package. See [ADR-0003](./09-decisions/adr-0003-dto-boundary-no-entity-exposure.md) |
| `@EntityGraph` | JPA fetch hint on `InventoryItemRepository` loading `supplier` in a single join to avoid N+1 queries |
| ErrorResponse | The canonical error record `{error, message, timestamp}` with an optional `fieldErrors` map on validation failures; `error` = `HttpStatus.name().toLowerCase()`. See [ADR-0004](./09-decisions/adr-0004-http-status-as-envelope.md) |
| Fly.io | Hosting platform for the backend (port 8081, health check `/api/health`) |
| GlobalExceptionHandler | `@ControllerAdvice` for framework and uncaught exceptions; applies `sanitize()`. See [ADR-0005](./09-decisions/adr-0005-error-message-sanitization.md) |
| HikariCP | JDBC connection pool, sized for Fly.io memory constraints |
| InventoryItem | Core domain entity representing a tracked stock item, linked to a `Supplier` |
| JaCoCo | Java code-coverage tool run in the CI pipeline |
| Koyeb | Hosting platform for the React frontend; the cross-origin request origin |
| mTLS | Mutual TLS — certificate-based transport authentication provided by the Oracle wallet. See [ADR-0001](./09-decisions/adr-0001-oracle-wallet-autologin.md) |
| N+1 problem | Repeated per-row association queries; avoided here via `@EntityGraph` |
| OAuth2 | Authentication via Google; on success the flow redirects to `/auth`. See [§6](./06-runtime.md) |
| `@PrePersist` / `@CreationTimestamp` | JPA / Hibernate callbacks that populate `createdAt` (and default `createdBy`) before insert |
| RBAC | Role-based access control; `ADMIN` and `USER` roles enforced via `@PreAuthorize` |
| `sanitize()` | `GlobalExceptionHandler` method stripping file paths, class names, SQL, and credentials from error messages. See [ADR-0005](./09-decisions/adr-0005-error-message-sanitization.md) |
| `SameSite=None; Secure` | Session cookie attributes configured on the backend; production browser traffic is same-origin via the Nginx serve-time rewrite — see [§7](./07-deployment.md) |
| StockChangeReason | Enum classifying each stock movement (`INITIAL_STOCK`, `MANUAL_UPDATE`, `SOLD`, …). See the enums reference |
| StockHistory | Domain entity recording each stock movement as an audit trail |
| Supplier | Domain entity representing a goods supplier linked to inventory items |
| `TNS_ADMIN` | Environment variable pointing the JDBC driver at the wallet directory |
| Trivy | Container-image CVE scanner run in the Docker build workflow |
| WAC | Weighted Average Cost inventory costing method used by `AnalyticsService` |
| Wallet (Oracle) | Directory of TLS certificates and config (`tnsnames.ora`, `ewallet.p12`, …) authenticating the DB connection; delivered at runtime as a Fly secret. See [ADR-0009](./09-decisions/adr-0009-runtime-wallet-delivery.md) |
