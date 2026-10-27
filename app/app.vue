<template>
  <AppProgressBar />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppConfirm />
  <UiToaster />
</template>

<script setup lang="ts">
const { appliedTheme, appliedHue, appliedPalette } = useAppearance()
const { t, locale } = useI18n()
const config = useRuntimeConfig()
const absolute = useSiteUrl()

const OG_LOCALES: Record<string, string> = { 'ja': 'ja_JP', 'en': 'en_US', 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW' }

useHead({
  titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} | ${SITE_NAME}` : SITE_NAME,
  htmlAttrs: {
    'lang': () => locale.value,
    'data-theme': () => appliedTheme.value,
    // A string: a numeric 0 would be dropped as empty.
    'style': () => `--hue: ${appliedHue.value}`,
    // ink: a near-black theme colour on faintly violet greys (theme.css); left out for the hue presets.
    'data-palette': () => appliedPalette.value,
  },
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
    { rel: 'icon', href: '/icon.png', type: 'image/png', sizes: '192x192' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  ],
})

// Defaults for every page; pages fill in their own through usePageSeo (docs/seo in the API repo).
useSeoMeta({
  description: () => t('home.seo_description'),
  ogSiteName: SITE_NAME,
  ogLocale: () => OG_LOCALES[locale.value],
  ogImage: absolute('/icon.png'),
  twitterCard: 'summary',
  robots: config.public.indexable ? 'max-image-preview:large' : 'noindex, nofollow',
})
</script>
