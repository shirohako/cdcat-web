/** A group mail category and whether the user receives it (GET /v1/me/mail-subscriptions). */
export interface MailSubscription {
  key: string
  /** Per locale; English is always there. */
  names: Record<string, string>
  descriptions: Record<string, string>
  /** Sent to everyone; cannot be turned off. */
  is_required: boolean
  is_subscribed: boolean
}

/** The mail settings behind the signed link in every group mail (GET /v1/mail/preferences/{token}). */
export interface MailPreferences {
  /** Masked, e.g. a***@example.com. */
  email: string
  mail_locale: string
  /** The category of the mail the link came from; null for a plain "email settings" link. */
  category: { key: string, names: Record<string, string>, is_required: boolean } | null
  mail_subscriptions: MailSubscription[]
}
