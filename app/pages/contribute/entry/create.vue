<template>
  <EditorEntityEditor :key="String(route.query.revision ?? '')" type="entry" :revision-id="revisionId" :initial="initial">
    <p v-if="initial" class="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-900">{{ $t('catalog.contribute.imported') }}</p>
    <EditorEntityEntryFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// A new entry, empty or filled from the Bangumi preview that /contribute/entry left in state.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const importedEntry = useState<Record<string, unknown> | null>('entry-import', () => null)
const revisionId = computed(() => Number(route.query.revision) || null)
const initial = route.query.from === 'bangumi' ? importedEntry.value : null

useSeoMeta({ title: () => t('catalog.contribute.create_entry'), robots: 'noindex' })
</script>
