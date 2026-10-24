<template>
  <EditorEntityEditor :key="`${route.query.revision ?? ''}:${draftScope ?? ''}`" type="entry" :revision-id="revisionId" :draft-scope="draftScope" :initial="initial">
    <p v-if="initial" class="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-900 dark:border-pink-400/25 dark:bg-pink-400/15 dark:text-pink-200">{{ $t('catalog.contribute.imported') }}</p>
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
const draftScope = computed(() => typeof route.query.draft === 'string' ? route.query.draft : null)
const initial = route.query.from === 'bangumi' ? importedEntry.value : null

useSeoMeta({ title: () => t('catalog.contribute.create_entry'), robots: 'noindex' })
</script>
