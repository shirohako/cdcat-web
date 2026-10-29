<template>
  <div>
    <!-- One element root: the out-in page transition can't animate the comment a root v-if leaves behind. -->
    <ApiDocsDocument v-if="doc" :doc="doc" />
  </div>
</template>

<script setup lang="ts">
import { loadApiDocs } from '~/api-docs'
import { compactLd } from '~/utils/structuredData'

const { t, locale } = useI18n()
const absolute = useSiteUrl()

// Keyed by language: switching keeps showing the old words until the new ones have loaded.
const { data: doc } = await useAsyncData(() => `api-docs:${locale.value}`, () => loadApiDocs(locale.value), { deep: false })

usePageSeo({
  title: () => t('about_page.api_docs'),
  description: () => t('seo.pages.api_docs'),
  breadcrumbs: () => [{ name: t('menu.about'), path: '/about' }, { name: t('about_page.api_docs'), path: '/docs/api' }],
  jsonLd: () => doc.value && compactLd({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'name': t('about_page.api_docs'),
    'url': absolute('/docs/api'),
    'inLanguage': doc.value.locale,
    'dateModified': doc.value.updated,
  }),
})
</script>
