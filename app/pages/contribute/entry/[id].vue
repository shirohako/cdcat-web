<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { $api } = useNuxtApp()
const { t } = useI18n()
const id = String(route.params.id)
const { data, pending, error, refresh } = await useAsyncData(`edit-entry-${id}`, () => $api<Record<string, unknown>>(`/v1/entries/${id}/schema`))
useHead({ title: computed(() => t('revision_entry.edit_title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="mb-6 text-3xl font-bold">{{ t('revision_entry.edit_title') }}</h1>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <RevisionEntryForm v-if="data" :initial-data="data" :entry-id="id" />
    </AdminListState>
  </div>
</template>
