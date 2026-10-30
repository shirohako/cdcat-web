import type { LegalKind } from './types'

/** Facts the legal texts quote, kept in one place so every language says the same thing. */
export const CONTACT_EMAIL = 'support@cdcat.net'
/** Must match User::MINIMUM_AGE in the API, which refuses younger sign-ups. */
export const MIN_AGE = 13
/** Days we take to answer a request for a copy of your data or to close your account. */
export const REQUEST_DAYS = 30
/** Days of notice before a significant change to either document takes effect. */
export const NOTICE_DAYS = 7
export const DATA_LICENSE = { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' }

/** When each document took effect and when it last changed (YYYY-MM-DD); bump `updated` with every edit. */
export const LEGAL_DATES: Record<LegalKind, { effective: string, updated: string }> = {
  terms: { effective: '2026-10-25', updated: '2026-10-30' },
  privacy: { effective: '2026-10-25', updated: '2026-10-30' },
}
