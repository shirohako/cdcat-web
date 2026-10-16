<script setup lang="ts">
import { ArrowLeft, Film } from '@lucide/vue'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const { t } = useI18n()
const importedEntry = useState<Record<string, unknown> | null>('entry-import', () => null)

const isFromBangumi = computed(() => route.query.from === 'bangumi' && !!importedEntry.value)
const initialData = computed(() => isFromBangumi.value ? importedEntry.value : null)

useHead({ title: computed(() => t('catalog.contribute.create_entry')) })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl 2xl:max-w-7xl">
      <div class="mb-8">
        <NuxtLink to="/contribute/entry" class="mb-4 inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-primary">
          <ArrowLeft class="h-4 w-4" />
          {{ $t('catalog.contribute.back') }}
        </NuxtLink>

        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Film class="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ $t('catalog.contribute.create_entry') }}</h1>
            <p class="text-sm text-gray-600">{{ isFromBangumi ? $t('catalog.contribute.imported') : $t('catalog.contribute.create_hint') }}</p>
          </div>
        </div>
      </div>

      <RevisionEntryForm :initial-data="initialData" />
    </div>
  </div>
</template>
