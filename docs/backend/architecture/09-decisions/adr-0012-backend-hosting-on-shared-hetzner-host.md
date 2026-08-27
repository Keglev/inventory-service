# ADR-0012: Backend hosting on the shared Hetzner host

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-08-28

## Context
The backend ran on a 1 GB Fly.io VM, released by a manually triggered
`fly deploy`. The same portfolio already pays for a Hetzner CX33 that runs the
maintenance-assistant project: a backend, a Keycloak, and a Caddy that terminates
TLS for the whole host. That machine was measured before the move at 1.7 GB of
7.7 GB used, with 6.0 GB available — enough to carry a second demo application
without touching the existing services' limits.

Forces:
- Two portfolio projects should not carry two hosting bills when one machine has
  four fifths of its memory idle.
- Oracle Always Free requires the database allow-list to name a stable IPv4. Any
  new home must have one that does not rotate.
- The manual `fly deploy` step is the last part of the pipeline a human still
  drives; it should become as automatic as the frontend path already is.
- The neighbours must not be able to lose memory to this container, and this
  container must not be able to lose it to them.

## Decision
Run the backend as a container on the CX33 host, released automatically by
`4-deploy-backend.yml` after the image build and CVE scan succeed on `main`.

The container is capped at 1400 MiB, with `memswap_limit` equal to `mem_limit`.
The limit is derived from the heap ceiling rather than from observed RSS:
`scripts/start.sh` sets `-XX:MaxRAMPercentage=75`, so a 1400 MiB cgroup yields
roughly a 1 GiB heap — a deliberate step above the 768 MiB the JVM had on the
1 GB Fly.io VM. Without a cgroup limit the JVM would size its heap against the
host's 7.5 GiB and starve the neighbours (maintenance backend 1536m, Keycloak
1280m). A 2 GB swapfile was prepared on the maintenance side for the
neighbours' indexing bursts; this container is deliberately excluded from it,
because a JVM paging its heap degrades far worse than it restarts.

The service joins the maintenance-assistant project's existing compose network
as an external network rather than introducing a shared one. Caddy resolves
`ssp-backend` by container name and terminates TLS for `api.smartsupplypro.de`.
The coupling is explicit and worth naming: this project depends on the
neighbour's network identity, and the site block that routes to it lives in the
neighbour's repository.

Images move from Docker Hub to GHCR under the repository's own package, so the
backend release path authenticates with `GITHUB_TOKEN` and carries no registry
secret. The host's static IPv4, with auto-delete disabled, is the Oracle ACL
anchor. Host operating rules are fixed: root provisions directories and hands
them to `deploy`, `deploy` operates them and has no sudo.

## Alternatives Considered
- **Stay on Fly.io.** Rejected: a second bill for an application the already-paid
  host can carry, and the manual release step stays manual.
- **AWS Lightsail with its own Caddy.** Rejected: the same job as the existing
  host for a second bill, and a second TLS terminator to maintain.
- **A second Hetzner server for this project alone.** Rejected: doubles the cost
  for demo traffic that the current machine does not notice.

## Consequences
- One OOM event or one reboot now affects both portfolio demos. This is the
  reason the memory limits are mandatory rather than advisory, and the reason
  the container is kept off the swapfile.
- The release path no longer touches the database allow-list, because the host
  IPv4 is fixed and already whitelisted.
- `api.smartsupplypro.de` and `www.smartsupplypro.de` now share a registrable
  domain. The session cookie can therefore move from `SameSite=None` to `Lax` in
  a follow-up change, narrowing the cross-site surface described in ADR-0007.
- Removing this service means removing the Caddy site block in the
  maintenance-assistant repository; the two are no longer independent.

## Implementation Notes
- Compose file: `docker/docker-compose.prod.yml` (source of truth; copied to
  `/opt/smartsupplypro` on every release).
- Release workflow: `.github/workflows/4-deploy-backend.yml`.
- Host runbook, including the `.env.prod` variable list: `docker/README.md`.
- `fly.toml` and `4-deploy-fly.yml` are removed by the same change.

## References
- [ADR-0007: Cross-origin session cookie configuration](adr-0007-cross-origin-auth-cookie.md)
- [ADR-0009: Runtime wallet delivery via Fly secret](adr-0009-runtime-wallet-delivery.md)
- [ADR-0010: Custom domain with a canonical `www` host](adr-0010-custom-domain-and-canonical-host.md)
- Section 7 Deployment (`../07-deployment.md`)
