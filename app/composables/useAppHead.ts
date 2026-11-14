import fontFacesUrl from '~/assets/css/fonts.css?url'

/** Each interface language as Open Graph names it. */
export const OG_LOCALES: Record<string, string> = { 'ja': 'ja_JP', 'en': 'en_US', 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', 'ko': 'ko_KR' }

/**
 * The document's language, theme, title template, icons and default share tags. app.vue sets them, and so does
 * error.vue, which Nuxt renders in its place.
 */
export function useAppHead() {
  const { appliedTheme, appliedHue, appliedPalette, appliedTextSize } = useAppearance()
  const { style: creditLinks } = useCreditLinks()
  const { t, locale } = useI18n()
  const config = useRuntimeConfig()
  const absolute = useSiteUrl()

  useHead({
    titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} | ${SITE_NAME}` : SITE_NAME,
    htmlAttrs: {
      'lang': () => locale.value,
      'data-theme': () => appliedTheme.value,
      // A string: a numeric 0 would be dropped as empty.
      'style': () => `--hue: ${appliedHue.value}`,
      // ink: a near-black theme colour on faintly violet greys (theme.css); left out for the hue presets.
      'data-palette': () => appliedPalette.value,
      // How credited names show the part that links (main.css, useCreditLinks)
      'data-credit-links': () => creditLinks.value,
      // The root font size every rem follows (main.css); left out in the admin console, which keeps the browser's own.
      'data-text-size': () => appliedTextSize.value === undefined ? undefined : String(appliedTextSize.value),
    },
    link: [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/icon.png', type: 'image/png', sizes: '192x192' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  })

  // The body faces' @font-face rules (assets/css/fonts.css) are a stylesheet of their own, fetched at once and
  // switched on when it arrives: as `media="print"` it holds up neither the first paint nor the scripts.
  if (import.meta.dev) {
    // Under `nuxt dev` the server and the browser know the file by one address, so the head can carry the links.
    useHead({
      link: [
        // The preload is what gets it fetched early: browsers leave a print stylesheet for last.
        { rel: 'preload', as: 'style', href: fontFacesUrl },
        { rel: 'stylesheet', href: fontFacesUrl, media: 'print', onload: 'this.media=\'all\'', key: 'font-faces' },
      ],
      // Without scripts nothing switches it on, so it is linked the plain way.
      noscript: [{ innerHTML: `<link rel="stylesheet" href="${fontFacesUrl}">`, key: 'font-faces' }],
    })
  }
  else if (import.meta.client && !document.querySelector('link[data-font-faces]')) {
    // In a build, the server's bundle hashes the file to another name than the browser's, and only the browser's
    // exists: server/plugins/font-faces.ts writes the links, with the name the build's manifest gives. This is the
    // net under it: should the page arrive without them, the browser links the file itself.
    useHead({ link: [{ rel: 'stylesheet', href: fontFacesUrl, key: 'font-faces' }] })
  }

  // Defaults for every page; pages fill in their own through usePageSeo (docs/seo in the API repo).
  useSeoMeta({
    description: () => t('home.seo_description'),
    ogSiteName: SITE_NAME,
    ogLocale: () => OG_LOCALES[locale.value],
    ogImage: absolute('/icon.png'),
    twitterCard: 'summary',
    robots: config.public.indexable ? 'max-image-preview:large' : 'noindex, nofollow',
  })

  // Naver Search Advisor proves ownership of the site by this tag (NUXT_PUBLIC_NAVER_SITE_VERIFICATION).
  const naver = String(config.public.naverSiteVerification || '')
  if (naver) useHead({ meta: [{ name: 'naver-site-verification', content: naver }] })

  // Umami counts visits, and follows client-side page switches by itself (NUXT_PUBLIC_UMAMI_WEBSITE_ID). The key keeps
  // one copy when error.vue sets the head as well.
  const umamiId = String(config.public.umamiWebsiteId || '')
  const umamiSrc = String(config.public.umamiScriptUrl || '')
  if (umamiId && umamiSrc) {
    useHead({ script: [{ src: umamiSrc, defer: true, 'data-website-id': umamiId, key: 'umami' }] })
  }
}
