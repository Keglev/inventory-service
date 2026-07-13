# §5.7 System Domain

System-level pages under `frontend/src/pages/system/`: currently the 404
not-found page, rendered as the router's catch-all. It stays inside the active
shell (public or authenticated) so navigation chrome remains available, offers a
route back to the dashboard or home depending on session state, and is fully
localized like every other page.
