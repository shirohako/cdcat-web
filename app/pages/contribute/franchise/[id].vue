<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const { $api } = useNuxtApp()
const { t } = useI18n()
const franchiseId = String(route.params.id)

const { data, pending, error, refresh } = await useAsyncData(`edit-franchise-${franchiseId}`, () => $api<Record<string, unknown>>(`/v1/franchises/${franchiseId}/schema`))
useHead({ title: computed(() => t('catalog.contribute.edit_series')) })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl 2xl:max-w-7xl">
      <div class="mb-8">
        <NuxtLink :to="`/franchises/${franchiseId}`" class="btn btn-ghost btn-sm mb-4 gap-2">
          <ArrowLeft class="h-4 w-4" />
          {{ $t('catalog.contribute.back_series') }}
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('catalog.contribute.edit_series') }}</h1>
        <p class="mt-1 text-gray-500">{{ $t('catalog.contribute.edit_series_desc') }}</p>
      </div>

      <AdminListState :pending="pending" :error="error" @retry="refresh()">
        <div class="max-w-5xl">
          <RevisionFranchiseForm v-if="data" :initial-data="data" :franchise-id="franchiseId" />
        </div>
      </AdminListState>
    </div>
  </div>
</template>
