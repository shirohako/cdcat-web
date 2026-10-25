<template>
  <div>
    <!-- One element root: the out-in page transition can't animate the comment a root v-if leaves behind. -->
    <LegalDocument v-if="doc" :doc="doc" kind="privacy" />
  </div>
</template>

<script setup lang="ts">
import { loadLegal } from '~/legal'
import { compactLd } from '~/utils/structuredData'

const { t, locale } = useI18n()
const absolute = useSiteUrl()

// Keyed by language: switching keeps showing the old text until the new one has loaded.
const { data: doc } = await useAsyncData(() => `legal:privacy:${locale.value}`, () => loadLegal('privacy', locale.value), { deep: false })

usePageSeo({
  title: () => t('legal.privacy_title'),
  description: () => t('seo.pages.privacy'),
  breadcrumbs: () => [{ name: t('legal.privacy_title'), path: '/privacy' }],
  jsonLd: () => doc.value && compactLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': t('legal.privacy_title'),
    'url': absolute('/privacy'),
    'inLanguage': locale.value,
    'datePublished': doc.value.effective,
    'dateModified': doc.value.updated,
  }),
})
</script>
