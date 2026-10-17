<template>
  <div class="min-h-screen bg-gray-50/50">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      <NuxtLink to="/revisions" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft :size="14" />{{ $t('revision_page.back') }}</NuxtLink>

      <div v-if="pending" class="flex min-h-60 items-center justify-center"><span class="loading loading-spinner" /></div>
      <p v-else-if="error || !revision" class="alert alert-error">{{ localizeError(error) }}</p>

      <template v-else>
        <header class="mb-5 flex flex-wrap items-start gap-3">
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl font-bold text-gray-900">{{ heading }}</h1>
            <p v-if="revision.summary" class="mt-1 whitespace-pre-line text-gray-700">{{ revision.summary }}</p>
            <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>#{{ revision.id }}</span>
              <span v-if="revision.kind === 'lyric'">{{ $t('revision_page.kind.lyric') }}</span>
              <span v-if="revision.origin !== 'manual'">{{ $t(`revision_page.origin.${revision.origin}`) }}</span>
              <span v-if="revision.submitter">{{ $t('revision_page.by', { name: revision.submitter.nickname || revision.submitter.username }) }}</span>
              <span :title="exact(revision.updated_at)">{{ $t('revision_page.updated', { at: ago(revision.updated_at) }) }}</span>
              <span v-if="revision.requires_content_manage && revision.status === 'pending'" class="text-amber-700">{{ $t('revision_page.requires_manage') }}</span>
            </p>
          </div>
          <RevisionStatusBadge :status="revision.status" />
        </header>

        <div v-if="mine" class="mb-5 flex flex-wrap gap-2">
          <NuxtLink v-if="isOpenRevision(revision.status) && editor" :to="editor" class="btn btn-primary btn-sm">{{ $t('revision_page.continue') }}</NuxtLink>
          <button v-if="revision.status === 'draft'" type="button" class="btn btn-sm" :disabled="busy" @click="submit">{{ $t('revision_page.submit') }}</button>
          <button v-if="revision.status === 'pending'" type="button" class="btn btn-ghost btn-sm text-error" :disabled="busy" @click="withdraw">{{ $t('revision_page.withdraw') }}</button>
          <button v-if="revision.status === 'draft'" type="button" class="btn btn-ghost btn-sm text-error" :disabled="busy" @click="remove">{{ $t('revision_page.delete_draft') }}</button>
        </div>
        <p v-if="message" class="mb-4 text-sm text-error">{{ message }}</p>

        <div v-if="revision.review_comment" class="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p class="font-semibold">{{ $t('revision_page.review_comment') }}<span v-if="revision.reviewer" class="font-normal"> · {{ revision.reviewer.nickname || revision.reviewer.username }}</span></p>
          <p class="mt-1 whitespace-pre-line">{{ revision.review_comment }}</p>
        </div>

        <div v-if="mine && conflictsByItem.length" class="mb-5 space-y-3">
          <EditorConflictResolver
            v-for="group in conflictsByItem"
            :key="group.ref"
            :revision-id="revision.id"
            :conflicts="group.conflicts"
            :type="group.type"
            @resolved="refresh()"
          />
        </div>
        <div v-if="problems.length" class="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p class="font-semibold">{{ $t('revision_page.errors') }}</p>
          <ul class="mt-1 list-inside list-disc space-y-0.5">
            <li v-for="problem in problems" :key="problem.path"><span class="font-mono text-xs opacity-70">{{ problem.path }}</span> {{ problem.message }}</li>
          </ul>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div class="min-w-0 space-y-3">
            <h2 class="text-sm font-bold uppercase tracking-wider text-gray-400">{{ $t('revision_page.items') }}</h2>
            <RevisionItems :items="revision.items ?? []" :references="revision.references ?? {}" />
          </div>
          <aside class="space-y-5">
            <div v-if="revision.sources.length">
              <h2 class="mb-2 text-sm font-bold uppercase tracking-wider text-gray-400">{{ $t('revision_page.sources') }}</h2>
              <ul class="space-y-1 text-sm">
                <li v-for="source in revision.sources" :key="source" class="break-all">
                  <a v-if="/^https?:\/\//.test(source)" :href="source" target="_blank" rel="noopener nofollow" class="text-primary hover:underline">{{ source }}</a>
                  <span v-else class="text-gray-700">{{ source }}</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 class="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">{{ $t('revision_page.timeline') }}</h2>
              <RevisionTimeline :events="revision.events ?? []" />
            </div>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CatalogType } from '~/types/catalog'
import type { Revision } from '~/types/revision'
import { ArrowLeft } from '@lucide/vue'
import { errorName, revisionFieldErrors } from '~/utils/revisionErrors'
import { editorPath, isOpenRevision } from '~/utils/revisionLinks'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { user } = useAuth()
const { ago, exact } = useRelativeTime()
const { enumLabel } = useCatalogDisplay()
const { localizeError } = useLocalizedApiError()

const { data: revision, pending, error, refresh } = await useAsyncData(`revision:${route.params.id}`, () => $api<Revision>(`/v1/revisions/${route.params.id}`), { server: false })

const mine = computed(() => !!revision.value && revision.value.submitter?.id === user.value?.id)
const editor = computed(() => revision.value ? editorPath(revision.value) : null)
const heading = computed(() => {
  const match = revision.value?.title?.match(/^([a-z]+): (.*)$/)
  return match ? `${enumLabel('catalog_type', match[1]!)} · ${match[2]}` : (revision.value?.title || `#${route.params.id}`)
})

/** Conflicts with the current content, from the merge preview of an open revision. */
const conflictsByItem = computed(() => (revision.value?.preview ?? []).filter(item => item.conflicts.length).map((item) => {
  const type = revision.value?.items?.find(entry => entry.ref === item.ref)?.resource_type ?? 'album'
  return { ref: item.ref, type: type as CatalogType, conflicts: item.conflicts.map(conflict => ({ ...conflict, ref: item.ref })) }
}))
const submitErrors = ref<Array<{ path: string, message: string }>>([])
const problems = computed(() => [
  ...(revision.value?.preview ?? []).flatMap(item => Object.entries(item.errors ?? {}).map(([path, message]) => ({ path, message: String(message) }))),
  ...submitErrors.value,
])

const busy = ref(false)
const message = ref('')
const run = async (request: () => Promise<unknown>, after?: () => unknown) => {
  busy.value = true
  message.value = ''
  submitErrors.value = []
  try {
    await request()
    await (after ? after() : refresh())
  } catch (failure) {
    if (errorName(failure) === 'VALIDATION_FAILED') submitErrors.value = revisionFieldErrors(failure)
    else message.value = localizeError(failure)
    // The merge preview now shows the conflicts to resolve.
    if (errorName(failure) === 'REVISION_CONFLICT') await refresh()
  } finally {
    busy.value = false
  }
}
const submit = () => run(() => $api(`/v1/revisions/${route.params.id}/submit`, { method: 'POST' }))
const withdraw = () => confirm(t('revision_page.withdraw_confirm')) && run(() => $api(`/v1/revisions/${route.params.id}/withdraw`, { method: 'POST' }))
const remove = () => confirm(t('revision_page.delete_confirm')) && run(() => $api(`/v1/revisions/${route.params.id}`, { method: 'DELETE' }), () => router.push('/revisions'))

useSeoMeta({ title: () => heading.value, robots: 'noindex' })
</script>
