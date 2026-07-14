# §5.6 Home Domain

The public landing page under `frontend/src/pages/home/`: minimal by design,
rendered in the public shell, free of authenticated chrome and of any data
queries before a session exists. It presents the product introduction and the two
entry actions — Google sign-in and demo mode — through the same `useAuth()`
actions as the login page (`auth` namespace keys: `welcome`, `or`, `signIn`,
`continueDemo`, `ssoHint`). Keeping the root route this small makes the
unauthenticated first paint fast and the public/authenticated shell split clean
([ADR-0005](../09-decisions/adr-0005-shell-split-authenticated-vs-public.md)).
