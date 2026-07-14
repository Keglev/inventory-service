# ADR-0009: Runtime wallet delivery via Fly secret (supersedes image bundling)

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted — supersedes the delivery and password model of
[ADR-0001](adr-0001-oracle-wallet-autologin.md)

## Date
2026-07-14 (records an operational change that predates this ADR; documented
retroactively when the docs accuracy pass found the chapters describing the
superseded mechanism)

## Context
[ADR-0001](adr-0001-oracle-wallet-autologin.md) decided to bundle an auto-login
Oracle wallet (`cwallet.sso`) into the Docker image, with `TNS_ADMIN` injected as a
Fly secret and no wallet password at runtime. That design carried a documented
residual risk: anyone who obtains the image obtains the wallet. It also coupled
wallet rotation to an image rebuild and redeploy, and placed credential material in
an artifact that is pushed to a public registry (Docker Hub) after CVE scanning.

Forces/constraints:
- **No credentials in the image**: the pushed image should contain no secret
  material at all, making registry exposure and image extraction harmless.
- **Rotation without rebuild**: replacing the wallet should be an operational
  action (update a secret, restart), not a build-pipeline action.
- **Fail fast**: a container started without its credentials must exit with a
  clear error instead of booting into a broken state.

## Decision
The wallet is removed from the repository (`oracle_wallet/` is gitignored) and from
the image. It is delivered at runtime as a **base64-encoded Fly secret**, and the
startup script owns extraction and configuration:

1. `scripts/start.sh` requires `ORACLE_WALLET_B64`; if absent, it exits immediately.
2. The secret is base64-decoded to a zip and extracted to
   `/app/wallet/Wallet_sspdb_fixed`; the zip is deleted and the raw variable
   `unset` afterward to reduce exposure in process dumps.
3. The script verifies the extracted wallet (`tnsnames.ora` and `ewallet.p12` must
   be present) and sets `TNS_ADMIN` itself — `TNS_ADMIN` is **not** a Fly secret.
4. The JVM is started with `-Doracle.net.wallet_password=${ORACLE_WALLET_PASSWORD}`:
   the wallet is used in its encrypted form, and a **wallet password is supplied at
   runtime** as a second Fly secret. Under the script's `set -u`, startup fails
   fast if the password secret is missing.
5. `DB_URL`, `DB_USER`, and `DB_PASS` (Fly secrets) are mapped to the Spring
   datasource properties by the same script.

This inverts two elements of ADR-0001: the wallet lives outside the image, and the
encrypted-wallet-plus-password model (ADR-0001's rejected Alternative 2) is the one
in production.

## Alternatives Considered

1. **Keep the image-bundled auto-login wallet (ADR-0001 as written)**
   - Pros:
     - No wallet-related runtime secrets at all
   - Cons:
     - Wallet present in every pushed image; image extraction yields it
     - Rotation requires rebuild and redeploy
2. **Fly volume holding the wallet**
   - Pros:
     - No size limits, wallet never in env space
   - Cons:
     - Ties the app to a volume and a region; complicates redeploys and machine
       migration for no gain at this wallet size

## Consequences

### Positive
- The pushed image contains no credential material; registry exposure and image
  extraction are harmless (this retires the image-extraction risk documented in
  ADR-0001 and formerly tracked as R-02).
- Wallet rotation: update `ORACLE_WALLET_B64` (and password if changed), restart —
  no rebuild.
- Missing secrets stop the container at startup with an explicit error.

### Negative / Tradeoffs
- Two additional runtime secrets (`ORACLE_WALLET_B64`, `ORACLE_WALLET_PASSWORD`)
  must be managed in Fly's secret store, alongside `DB_URL`/`DB_USER`/`DB_PASS`.
- The wallet exists decrypted-in-transit inside Fly's secret store and, extracted,
  on the running container's filesystem — the trust boundary moves from the image
  to the platform's secret handling and the live machine.
- The base64 value is large for a secret; wallet updates are a copy-paste-sensitive
  operation.

## Implementation Notes
- `scripts/start.sh` — the entire mechanism: decode, extract, verify, `TNS_ADMIN`
  export, `oracle.net.wallet_password`, `DB_*` mapping, `exec java`.
- `Dockerfile` — no wallet `COPY`; the runtime stage ships the jar and `start.sh`.
- `.gitignore` — `oracle_wallet/` and wallet file patterns are excluded from
  version control.
- `fly.toml [env]` — carries only non-secret configuration; all credentials are
  Fly secrets.

## References
- [ADR-0001](adr-0001-oracle-wallet-autologin.md) — the superseded delivery model;
  mTLS-via-wallet and the account-credential layer (`DB_USER`/`DB_PASS`) remain as
  decided there
- [§7 Deployment View](../07-deployment.md) — secrets table and wallet section
