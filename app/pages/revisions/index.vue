<template>
  <div class="min-h-screen bg-gray-50/50">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      <header class="mb-6 flex flex-wrap items-end gap-3">
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-bold tracking-tight text-gray-900">{{ $t('collection_pages.revisions.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ $t('collection_pages.revisions.description') }}</p>
        </div>
        <NuxtLink to="/contribute/album" class="btn btn-primary btn-sm gap-1"><Plus :size="14" />{{ $t('revision_page.new_album') }}</NuxtLink>
      </header>

      <nav class="mb-5 flex gap-1 overflow-x-auto pb-1">
        <button
          v-for="value in FILTERS"
          :key="value"
          type="button"
          class="shrink-0 rounded-full px-3 py-1.5 text-sm"
          :class="status === value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'"
          @click="setStatus(value)"
        >{{ value === 'all' ? $t('revision_page.all') : $t(`revision_page.status.${value}`) }}</button>
      </nav>

      <div v-if="pending" class="flex min-h-60 items-center justify-center"><span class="loading loading-spinner" /></div>
      <p v-else-if="error" class="alert alert-error">{{ localizeError(error) }}</p>
      <div v-else-if="!revisions.length" class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <GitPullRequest :size="28" class="mx-auto mb-3 text-gray-300" />
        <p class="text-sm text-gray-500">{{ $t('revision_page.empty') }}</p>
      </div>

      <ul v-else class="space-y-3">
        <li v-for="revision in revisions" :key="revision.id" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex flex-wrap items-start gap-3">
            <div class="min-w-0 flex-1">
              <NuxtLink :to="`/revisions/${revision.id}`" class="font-semibold text-gray-900 hover:underline">{{ heading(revision) }}</NuxtLink>
              <p v-if="revision.summary" class="mt-0.5 line-clamp-2 text-sm text-gray-600">{{ revision.summary }}</p>
              <p class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                <span v-if="revision.kind === 'lyric'" class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">{{ $t('revision_page.kind.lyric') }}</span>
                <span v-for="item in revision.items" :key="item.ref" class="rounded bg-gray-100 px-1.5 py-0.5">
                  {{ $t(`revision_page.action.${item.action}`) }} · {{ enumLabel('catalog_type', item.resource_type) }}<template v-if="item.resource_id"> #{{ item.resource_id }}</template>
                </span>
                <span class="text-gray-400">#{{ revision.id }} · {{ ago(revision.updated_at) }}</span>
              </p>
            </div>
            <RevisionStatusBadge :status="revision.status" />
          </div>
          <p v-if="revision.review_comment && ['changes_requested', 'rejected'].includes(revision.status)" class="mt-3 whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span class="font-medium">{{ $t('revision_page.review_comment') }}：</span>{{ revision.review_comment }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <NuxtLink v-if="isOpenRevision(revision.status) && editorPath(revision)" :to="editorPath(revision)!" class="btn btn-sm">{{ $t('revision_page.continue') }}</NuxtLink>
            <NuxtLink :to="`/revisions/${revision.id}`" class="btn btn-ghost btn-sm">{{ $t('common.details') }}</NuxtLink>
            <button v-if="revision.status === 'pending'" type="button" class="btn btn-ghost btn-sm text-error" :disabled="busy === revision.id" @click="withdraw(revision)">{{ $t('revision_page.withdraw') }}</button>
            <button v-if="revision.status === 'draft'" type="button" class="btn btn-ghost btn-sm text-error" :disabled="busy === revision.id" @click="remove(revision)">{{ $t('revision_page.delete_draft') }}</button>
          </div>
        </li>
      </ul>

      <div v-if="lastPage > 1" class="mt-6"><CommonPagination v-model:page="page" :total-pages="lastPage" :disabled="pending" /></div>
      <p v-if="message" class="mt-4 text-sm text-error">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Revision, RevisionStatus } from '~/types/revision'
import { GitPullRequest, Plus } from '@lucide/vue'
import { editorPath, isOpenRevision } from '~/utils/revisionLinks'

definePageMeta({ middleware: 'auth' })

const FILTERS = ['all', 'draft', 'pending', 'changes_requested', 'approved', 'rejected', 'withdrawn'] as const

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { ago } = useRelativeTime()
const { enumLabel } = useCatalogDisplay()
const { localizeError } = useLocalizedApiError()

const status = computed(() => (FILTERS as readonly string[]).includes(String(route.query.status)) ? String(route.query.status) as typeof FILTERS[number] : 'all')
const page = ref(Number(route.query.page) || 1)
const setStatus = (value: typeof FILTERS[number]) => {
  page.value = 1
  router.replace({ query: { ...route.query, status: value === 'all' ? undefined : value, page: undefined } })
}

const { data, pending, error, refresh } = await useAsyncData('me:revisions', () => $api<{ revisions: Revision[], pagination: { last_page: number } }>('/v1/me/revisions', {
  query: { status: status.value === 'all' ? undefined : status.value, page: page.value, per_page: 20 },
}), { watch: [status, page], server: false })

const revisions = computed(() => data.value?.revisions ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)

/** "album: 名前" from the server, with the type in the UI language. */
const heading = (revision: Revision) => {
  const match = revision.title?.match(/^([a-z]+): (.*)$/)
  if (match) return `${enumLabel('catalog_type', match[1]!)} · ${match[2]}`
  return revision.title || `#${revision.id}`
}

const busy = ref<number | null>(null)
const message = ref('')
const act = async (revision: Revision, question: string, request: () => Promise<unknown>) => {
  if (!confirm(question)) return
  busy.value = revision.id
  message.value = ''
  try {
    await request()
    await refresh()
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = null
  }
}
const withdraw = (revision: Revision) => act(revision, t('revision_page.withdraw_confirm'), () => $api(`/v1/revisions/${revision.id}/withdraw`, { method: 'POST' }))
const remove = (revision: Revision) => act(revision, t('revision_page.delete_confirm'), () => $api(`/v1/revisions/${revision.id}`, { method: 'DELETE' }))

const statusTitle = computed(() => status.value === 'all' ? '' : ` · ${t(`revision_page.status.${status.value as RevisionStatus}`)}`)
useSeoMeta({ title: () => `${t('collection_pages.revisions.title')}${statusTitle.value}`, robots: 'noindex' })
</script>
