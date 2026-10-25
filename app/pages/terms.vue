<template>
  <div>
    <!-- One element root: the out-in page transition can't animate the comment a root v-if leaves behind. -->
    <LegalDocument v-if="doc" :doc="doc" kind="terms" />
  </div>
</template>

<script setup lang="ts">
import { loadLegal } from '~/legal'
import { compactLd } from '~/utils/structuredData'

const { t, locale } = useI18n()
const absolute = useSiteUrl()

// Keyed by language: switching keeps showing the old text until the new one has loaded.
const { data: doc } = await useAsyncData(() => `legal:terms:${locale.value}`, () => loadLegal('terms', locale.value), { deep: false })

usePageSeo({
  title: () => t('legal.terms_title'),
  description: () => t('seo.pages.terms'),
  breadcrumbs: () => [{ name: t('legal.terms_title'), path: '/terms' }],
  jsonLd: () => doc.value && compactLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': t('legal.terms_title'),
    'url': absolute('/terms'),
    'inLanguage': locale.value,
    'datePublished': doc.value.effective,
    'dateModified': doc.value.updated,
  }),
})
</script>
