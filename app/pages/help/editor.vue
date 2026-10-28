<template>
  <div>
    <!-- One element root: the out-in page transition can't animate the comment a root v-if leaves behind. -->
    <GuideDocument v-if="doc" :doc="doc" kind="editor" />
  </div>
</template>

<script setup lang="ts">
import { loadGuide } from '~/guides'
import { compactLd } from '~/utils/structuredData'

const { t, locale } = useI18n()
const absolute = useSiteUrl()

// Keyed by language: switching keeps showing the old text until the new one has loaded.
const { data: doc } = await useAsyncData(() => `guide:editor:${locale.value}`, () => loadGuide('editor', locale.value), { deep: false })

usePageSeo({
  title: () => t('about_page.guide_submit_title'),
  description: () => t('seo.pages.guide_editor'),
  breadcrumbs: () => [{ name: t('menu.about'), path: '/about' }, { name: t('about_page.guide_submit_title'), path: '/help/editor' }],
  jsonLd: () => doc.value && compactLd({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'name': t('about_page.guide_submit_title'),
    'url': absolute('/help/editor'),
    'inLanguage': doc.value.locale,
    'dateModified': doc.value.updated,
  }),
})
</script>
