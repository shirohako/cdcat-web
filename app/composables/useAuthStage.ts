/**
 * The track the stylus is on in the record stage beside the login, register and reset forms (pages/auth.vue): 1–5,
 * one per sign-up step, or null with the arm parked on its rest. Each of those pages sets it for itself and its steps.
 * Which record is on comes from the route, so the server and the browser always agree on it.
 */
export const useAuthStageTrack = () => useState<number | null>('auth-stage-track', () => 1)
