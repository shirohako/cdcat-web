export interface SiteAnnouncement {
  content: string
  level: 'info' | 'warning'
  version: number
  ends_at: string | null
}

export interface SiteSettings {
  registration_open: boolean
  announcement: SiteAnnouncement | null
  /** Plain-text characters an article needs to be published. */
  article_content_min: number
}

/** Public site settings shared by the layout banner, the registration page and the article writer. */
export const useSite = () => {
  const { $api } = useNuxtApp()
  const { data } = useAsyncData('site:public', () => $api<SiteSettings>('/v1/site'), {
    // A failed request must not block browsing; the API still enforces the switch.
    default: () => ({ registration_open: true, announcement: null, article_content_min: 100 }),
  })
  return { site: data }
}
