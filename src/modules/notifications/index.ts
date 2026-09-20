// The notifications module's public API.
//
// One export: the authenticated layout calls `useArrivalNotifications()` once and renders the
// toast region from `useToasts()`. Everything else — the arrival arithmetic, the timer, the
// refetch — is internal, and the toast queue and `BaseToast` stay in `shared/`, since neither
// knows anything about ships.

export { useArrivalNotifications } from './composables/use-arrival-notifications';
