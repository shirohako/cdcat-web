export interface SiteAnnouncement {
  content: string
  level: 'info' | 'warning'
  version: number
  ends_at: string | null
}

export interface SiteSettings {
  registration_open: boolean
  announcement: SiteAnnouncement | null
}

/** Public site settings shared by the layout banner and the registration page. */
export const useSite = () => {
  const { $api } = useNuxtApp()
  const { data } = useAsyncData('site:public', () => $api<SiteSettings>('/v1/site'), {
    // A failed request must not block browsing; the API still enforces the switch.
    default: () => ({ registration_open: true, announcement: null }),
  })
  return { site: data }
}
