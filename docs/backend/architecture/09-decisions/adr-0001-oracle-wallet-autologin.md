# ADR-0001: Oracle Wallet auto-login for database authentication

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2025-06-01

## Context
SmartSupplyPro connects to Oracle Autonomous Database 23ai hosted on Oracle Cloud.
The production instance runs on Fly.io (region `fra`); the JDBC driver must
authenticate to Oracle ADB on every connection. Oracle ADB supports three
authentication mechanisms: username + password, encrypted wallet with wallet
password, and auto-login wallet (`cwallet.sso`).

Forces/constraints:
- **Credential security**: DB credentials must not live in plain-text environment
  variables or be committed to source control.
- **Operational simplicity**: A solo-developer portfolio project should minimise
  the number of secrets that must be managed and rotated.
- **Container portability**: The authentication mechanism must work inside a Docker
  image on Fly.io without an external secrets manager.
- **No second-factor overhead**: Keeping the wallet encrypted with a separate
  wallet password adds a second secret while providing no meaningful additional
  protection if the image is already protected.

## Decision
Use Oracle Wallet auto-login (`cwallet.sso`). The wallet directory
(`oracle_wallet/Wallet_sspdb_fixed/`) is bundled into the Docker image at build
time. At runtime, `TNS_ADMIN` points to the wallet directory; the wallet provides
mTLS (certificate-based channel authentication) to Oracle ADB. `DB_USER` and
`DB_PASS` still authenticate the database account — they are required. No
wallet password is needed because `cwallet.sso` is an auto-login credential
that carries the SSO token without a secondary passphrase.

## Alternatives Considered

1. **Username + password via environment variables**
   - Pros:
     - Simple to configure; widely understood
     - No binary wallet files in the repository
   - Cons:
     - Database password exposed as a secret — must be rotated if compromised
     - JDBC URL logging at startup risks exposing credentials
     - Password rotation requires a coordinated container restart

2. **Encrypted wallet (`ewallet.p12`) + wallet password**
   - Pros:
     - Wallet files are encrypted at rest on the filesystem
   - Cons:
     - Requires both the wallet directory (in image) and a wallet password (injected as a secret): two secrets instead of zero
     - No net security gain once the container image is already the trust boundary

3. **External secrets manager (e.g., HashiCorp Vault)**
   - Pros:
     - Credentials never appear in environment variables, images, or logs
     - Centralised rotation and audit trail
   - Cons:
     - Significant operational overhead for a solo portfolio project
     - Fly.io does not natively integrate with Vault; would require a sidecar agent

## Consequences

### Positive
- Zero DB credentials in environment variables, logs, or secrets vaults.
- `TNS_ADMIN` is the only wallet-related runtime injection needed.
- Two independent authentication layers: mTLS via `cwallet.sso` (channel) and
  `DB_USER` / `DB_PASS` (account) — both must succeed for a connection to open.
- Rotation is structural (new wallet → new image build) rather than operational
  (rotating a live secret).

### Negative / Tradeoffs
- The wallet is embedded in the Docker image. An attacker who extracts the image
  gains the `cwallet.sso` file. Residual risk: Oracle ADB still requires network
  access from a whitelisted IP/VPC; the wallet file alone is not sufficient.
- If the Oracle ADB instance is recreated, a new wallet must be downloaded,
  placed in `oracle_wallet/Wallet_sspdb_fixed/`, and the image rebuilt and
  redeployed.
- `cwallet.sso` is an auto-login credential with no secondary passphrase; there is
  no second factor protecting the wallet file itself.

## Implementation Notes
- Where it is implemented:
  - Wallet directory: `oracle_wallet/Wallet_sspdb_fixed/` — contains `cwallet.sso`,
    `tnsnames.ora`, `sqlnet.ora`, `ojdbc.properties`, `ewallet.p12`, `keystore.jks`,
    `truststore.jks`
  - `TNS_ADMIN` is injected as a Fly.io secret (`flyctl secrets set TNS_ADMIN=...`);
    it is not present in `fly.toml [env]` or committed to source control
  - `application-prod.yml` datasource uses `${DB_URL}` (JDBC TNS alias),
    `${DB_USER}`, and `${DB_PASS}`; all three are required at runtime

- Migration notes (if relevant):
  - If the Oracle ADB instance is recreated: download the new wallet from Oracle
    Cloud Console, replace the contents of `oracle_wallet/Wallet_sspdb_fixed/`,
    rebuild the Docker image, push via `2-docker-backend.yml`, and redeploy via
    `4-deploy-fly.yml`

- Testing implications:
  - The `test` profile uses H2 in Oracle-compatibility mode (`MODE=Oracle`); no
    wallet is needed. Oracle wallet authentication is exercised only by the `prod`
    profile and is not covered by unit or integration tests.

## References
- [§7 Deployment View](../07-deployment.md) — wallet path, `TNS_ADMIN` injection,
  Fly.io secrets table
- [§8 Configuration / Profiles](../08b-concepts-infra.md) — datasource config per
  profile, HikariCP prod tuning
