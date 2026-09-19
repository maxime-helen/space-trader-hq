// The auth module's public API.
//
// Everything else — the storage adapters, the token rules, the login page — is internal. Other
// modules and the app shell see exactly four things:
//
//   authRoutes              the `/login` route, lazily loaded, for `app/router.ts`;
//   useSessionStore         the session: `token`, `isAuthenticated`, `signIn`, `signOut`, `expire`;
//   connectAuthToApiClient  the one-time wiring of the client's token and 401 seams, at startup;
//   LOGIN_PATH, safeRedirect  where the shell's guard sends a visitor, and how it vets `?redirect=`.

export { authRoutes } from './routes';
export { LOGIN_PATH, safeRedirect } from '@/modules/auth/domain/redirect';
export { connectAuthToApiClient } from '@/modules/auth/session/connect';
export { useSessionStore } from '@/modules/auth/session/session.store';
