<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      <header class="mb-6">
        <NuxtLink to="/works" class="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft :size="14" />{{ $t('works.title') }}</NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('works.duplicates.title') }}</h1>
        <p class="mt-1 max-w-3xl text-sm text-gray-500">{{ $t('works.duplicates.hint') }}</p>
      </header>

      <div v-if="pending" class="flex justify-center py-10"><span class="loading loading-spinner" /></div>
      <p v-else-if="error" class="alert alert-error">{{ localizeError(error) }}</p>
      <p v-else-if="!groups.length" class="rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">{{ $t('works.duplicates.empty') }}</p>

      <ul v-else class="space-y-4">
        <li v-for="group in groups" :key="group.title_key" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <p class="border-b border-gray-100 bg-gray-50 px-4 py-2 font-mono text-[11px] text-gray-400">{{ group.title_key }}</p>
          <ul class="divide-y divide-gray-100">
            <li v-for="work in group.works" :key="work.id" class="flex flex-wrap items-center gap-3 px-4 py-3">
              <div class="min-w-0 flex-1">
                <NuxtLink :to="`/works/${work.id}`" class="font-medium text-gray-900 hover:underline">{{ work.title }}</NuxtLink>
                <span class="ml-2 text-xs text-gray-400">#{{ work.id }} · {{ $t('works.recordings', { count: work.tracks_count }) }}</span>
                <span v-if="work.has_lyrics" class="ml-2 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-600">{{ $t('album.tracklist.lyric') }}</span>
                <p class="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-500">
                  <NuxtLink v-for="album in work.albums" :key="album.id" :to="`/contribute/album/${album.id}`" class="hover:underline" :title="$t('works.duplicates.relink_hint')">{{ album.title }}</NuxtLink>
                </p>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <NuxtLink v-if="canMerge" :to="`/admin/content/works/${work.id}?tab=actions`" class="btn btn-ghost btn-xs">{{ $t('works.duplicates.merge') }}</NuxtLink>
                <button
                  v-if="canDismiss && open(group, work.id).length"
                  type="button"
                  class="btn btn-xs"
                  :disabled="busy"
                  @click="dismiss(group, work.id)"
                >{{ $t('works.duplicates.not_same') }}</button>
              </div>
            </li>
          </ul>
        </li>
      </ul>

      <CommonPagination v-if="lastPage > 1" class="mt-6" :page="page" :total-pages="lastPage" :disabled="pending" @update:page="page = $event" />
      <p v-if="message" class="mt-4 text-sm text-error">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

definePageMeta({ middleware: 'auth' })

interface DuplicateGroup {
  title_key: string
  works: Array<{ id: number, title: string, tracks_count: number, has_lyrics: boolean, albums: Array<{ id: number, title: string }> }>
  dismissed_pairs: Array<[number, number]>
}

const { t } = useI18n()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { localizeError } = useLocalizedApiError()

const page = ref(1)
const { data, pending, error, refresh } = await useAsyncData('works:duplicates', () => $api<{ groups: DuplicateGroup[], pagination: { last_page: number } }>('/v1/works/duplicates', {
  query: { page: page.value, per_page: 20 },
}), { watch: [page], server: false })
const groups = computed(() => data.value?.groups ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)
const canDismiss = computed(() => hasPermission('content.submit'))
const canMerge = computed(() => hasPermission('content.manage'))

/** The other works of the group not yet marked as a different song from this one. */
const open = (group: DuplicateGroup, workId: number) => group.works
  .filter(other => other.id !== workId && !group.dismissed_pairs.some(([a, b]) => (a === workId && b === other.id) || (b === workId && a === other.id)))
  .map(other => other.id)

const busy = ref(false)
const message = ref('')
const dismiss = async (group: DuplicateGroup, workId: number) => {
  busy.value = true
  message.value = ''
  try {
    for (const otherId of open(group, workId)) await $api(`/v1/works/${workId}/duplicate-dismissals/${otherId}`, { method: 'PUT' })
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}

useSeoMeta({ title: () => t('works.duplicates.title'), robots: 'noindex' })
</script>
