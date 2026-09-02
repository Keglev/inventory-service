# ADR-0010: Verifying a frontend deploy against the bytes the browser receives

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted — 2026-09-02.

## Context
Two properties of the production frontend cannot be established from the
repository. The serve-time API-base rewrite
([ADR-0008 (backend)](../../../backend/architecture/09-decisions/adr-0008-serve-time-api-base-rewrite.md))
exists only in the response body, and the identity of the running image exists
only in whatever the edge is currently serving. Neither is visible in the source
tree, in the built artifact, or in a green build.

The deploy workflow gated on the platform's own status: it polled
`koyeb service describe` until the output contained `healthy`. That is the
service's aggregate status, which stays healthy throughout a rolling update, so
the poll returned on its first iteration and every check after it ran against the
outgoing image. On the 2026-09-02 rollout the health check and the bundle check
both passed, and both passed on the previous build. The following deploy measured
the gap: the new build reached the edge about thirty seconds after the platform
reported healthy.

## Decision
The deploy establishes what it is looking at before it looks, by reading what the
edge serves:

1. `wait-for-build.sh` polls the served entry chunk until it contains the commit
   SHA being deployed. CI already passes that SHA as `VITE_BUILD_ID` and the app
   reads it as build metadata, so Vite inlines it — the bundle identifies its own
   build with no extra artifact.
2. `health-check.sh` runs the availability and smoke checks.
3. `verify-served-bundle.sh` asserts that the backend host is absent from the
   entry chunk and the frontend host is present, which is the detection ADR-0008
   named for its own fragility.

The platform poll is kept ahead of these as a fast failure when the service is
genuinely down, with a comment recording what it does not establish.

## Consequences
- A rollout that never reaches the edge fails the workflow instead of passing on
  the previous release.
- Every check after step 1 is known to describe the deployed build.
- A silent loss of the serve-time rewrite fails the deploy rather than returning
  production to the cross-origin path unnoticed.
- The deploy takes roughly thirty seconds longer, spent establishing a fact the
  pipeline previously assumed.
- The verification asserts on HTTP responses rather than on one provider's status
  vocabulary, so a hosting change does not invalidate it.
- The frontend host and backend origin are workflow variables; a domain change is
  an edit to `6-deploy-frontend.yml`, not to the scripts.
- The backend deploy shares the same readiness pattern and is not covered here. It
  has no equivalent build identifier in its responses and needs its own mechanism.

## Alternatives considered
- **Poll the platform for the specific new deployment** rather than the service:
  plausible, but it exchanges one dependence on the provider's status semantics
  for another, and those semantics are what failed.
- **A version endpoint** written at image build time: equivalent evidence, an
  extra artifact, and one more thing to keep in step with the bundle. The SHA
  already ships inside the bundle.
- **Trust the green build**: what was in place. It cannot observe serving-layer
  transforms or rollout timing, which is how both defects survived.
