<script setup lang="ts">
import { adminContentRoutes } from '~/config/admin'

definePageMeta({
  layout: 'admin', middleware: 'admin',
  validate: route => Boolean(adminContentRoutes[String(route.params.type)]),
})

const route = useRoute()
const { t } = useAdminI18n()
const type = computed(() => String(route.params.type))
const toRevision = (revisionId: number) => `/admin/revisions/${revisionId}`
useHead({ title: computed(() => t('admin_pages.content.create', { type: t(`admin_pages.types.${type.value}`) })) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <NuxtLink :to="`/admin/content/${type}`" class="text-sm text-slate-500 hover:text-slate-900">← {{ t('admin_pages.back_list') }}</NuxtLink>
    <h1 class="text-2xl font-bold">{{ t('admin_pages.content.create', { type: t(`admin_pages.types.${type}`) }) }}</h1>
    <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <p class="mb-4 text-sm text-slate-500">{{ t('admin_pages.content.create_help') }}</p>
      <RevisionWorkForm v-if="type === 'work'" :redirect-to="toRevision" />
      <RevisionArtistForm v-else-if="type === 'artist'" :redirect-to="toRevision" />
      <RevisionEntryForm v-else-if="type === 'entry'" :redirect-to="toRevision" />
      <RevisionSeriesForm v-else-if="type === 'franchise'" :redirect-to="toRevision" />
    </div>
  </div>
</template>
