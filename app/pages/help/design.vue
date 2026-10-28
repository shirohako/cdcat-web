<template>
  <div>
    <!-- One element root: the out-in page transition can't animate the comment a root v-if leaves behind. -->
    <GuideDocument v-if="doc" :doc="doc" kind="design" />
  </div>
</template>

<script setup lang="ts">
import { loadGuide } from '~/guides'
import { compactLd } from '~/utils/structuredData'

const { t, locale } = useI18n()
const absolute = useSiteUrl()

// Keyed by language: switching keeps showing the old text until the new one has loaded.
const { data: doc } = await useAsyncData(() => `guide:design:${locale.value}`, () => loadGuide('design', locale.value), { deep: false })

usePageSeo({
  title: () => t('about_page.guide_basics_title'),
  description: () => t('seo.pages.guide_design'),
  breadcrumbs: () => [{ name: t('menu.about'), path: '/about' }, { name: t('about_page.guide_basics_title'), path: '/help/design' }],
  jsonLd: () => doc.value && compactLd({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'name': t('about_page.guide_basics_title'),
    'url': absolute('/help/design'),
    'inLanguage': doc.value.locale,
    'dateModified': doc.value.updated,
  }),
})
</script>
