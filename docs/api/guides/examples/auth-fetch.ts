// Short TypeScript example: fetch profile using cookie-based session
// Usage: run in a browser context (or bundler) where cookies from the backend are available

export async function fetchProfile() {
  const resp = await fetch('/api/me', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!resp.ok) throw new Error(`Not authenticated: ${resp.status}`);
  return resp.json();
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
