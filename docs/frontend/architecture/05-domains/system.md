# §5.7 System Domain

System-level pages under `frontend/src/pages/system/`: currently the 404
not-found page, rendered as the router's catch-all inside the public shell (so
the header, footer, and legal links stay reachable on unknown paths). Its action
button adapts to session state — `/dashboard` for an authenticated user, `/login`
otherwise — and the page is fully localized like every other page.
