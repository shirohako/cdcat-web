const defaultBanners: Record<string, string> = {
  m3: '/images/events/m3-v2.webp',
  comiket: '/images/events/comic-market-v3.webp',
  reitaisai: '/images/events/reitaisai-v3.webp',
  vocamas: '/images/events/vocamas-v2.webp',
}

/** Prefer the managed banner; use the illustrated series cover when none is configured. */
export const eventSeriesBanner = (series: { slug: string, banner_url: string | null }) =>
  series.banner_url || defaultBanners[series.slug] || null
