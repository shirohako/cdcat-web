<script setup lang="ts">
import type { RevisionDraftPayload } from '~/composables/useRevisionDraft'
import type { CatalogImage } from '~/types/catalog'
import type { AlbumDocument } from '~/types/document'
import type { HarvestCandidateDetail, HarvestMergedImage } from '~/types/harvest'
import type { Revision } from '~/types/revision'
import { buildHarvestDraft } from '~/utils/harvestDraft'
import { harvestFilters } from '~/utils/harvestFilters'
import { ALBUM_REF } from '~/composables/useAlbumEditor'
import { draftKey, localDrafts } from '~/utils/localDrafts'
import { setCover } from '~/utils/albumDocument'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface EditorHandle {
  album: AlbumDocument
  remember: (type: string, id: number, row: object) => void
  go: (section: string) => void
}

const { $api } = useNuxtApp()
const { t, tm, rt } = useAdminI18n()
const harvestError = useHarvestError()
const { user } = useAuth()
const route = useRoute()
const id = computed(() => Number(route.params.id))
/** The list's filters, passed on: previous / next and the way back stay within that list. */
const filters = computed(() => harvestFilters(route.query))

const { data, pending, error, refresh } = await useAsyncData(() => `admin-harvest-candidate-${id.value}-${JSON.stringify(filters.value)}`,
  () => $api<HarvestCandidateDetail | { moved_to: number }>(`/v1/admin/harvest/candidates/${id.value}`, { query: filters.value }), { watch: [id, filters] })
const detail = computed(() => data.value && 'candidate' in data.value ? data.value : null)
watch(data, (value) => {
  if (value && 'moved_to' in value) navigateTo({ path: `/admin/harvest/review/${value.moved_to}`, query: filters.value }, { replace: true })
}, { immediate: true })

const open = computed(() => detail.value && ['pending', 'excluded'].includes(detail.value.candidate.status))
const scope = computed(() => `harvest:${id.value}`)
const editor = ref<EditorHandle | null>(null)
const editorKey = ref(0)
const draftReady = ref(false)
const message = ref('')
const busy = ref(false)

/** The reviewer's edits stay in this browser; a candidate opened for the first time starts from its sources. */
const prepareDraft = async (fresh = false) => {
  draftReady.value = false
  const userId = user.value?.id
  if (!detail.value || !userId || !open.value) return
  if (fresh) await localDrafts.remove(userId, scope.value).catch(() => undefined)
  const existing = fresh ? undefined : await localDrafts.get(userId, scope.value).catch(() => undefined)
  if (!existing) {
    const built = buildHarvestDraft(detail.value)
    const now = new Date().toISOString()
    await localDrafts.put({
      key: draftKey(userId, scope.value), userId, scope: scope.value, mainRef: ALBUM_REF, type: 'album', action: 'create', entityId: null, revisionId: null,
      label: detail.value.candidate.title, items: built.items, summary: built.summary, sources: built.sources, references: detail.value.references,
      createdAt: now, updatedAt: now,
    })
  }
  editorKey.value++
  draftReady.value = true
}
// The draft lives in this browser's IndexedDB, so it is prepared after mounting.
onMounted(() => {
  void prepareDraft()
  watch(detail, () => { void prepareDraft() })
})

const go = (target: number | null) => target && navigateTo({ path: `/admin/harvest/review/${target}`, query: filters.value })
const next = () => go(detail.value?.neighbors.next ?? null)
const previous = () => go(detail.value?.neighbors.previous ?? null)

const approve = (payload: RevisionDraftPayload) => $api<Revision>(`/v1/admin/harvest/candidates/${id.value}/approve`, {
  method: 'POST', body: { ...payload, lock_version: detail.value?.candidate.lock_version },
})
const approved = async () => {
  const following = detail.value?.neighbors.next
  if (following) return go(following)
  await refresh()
}

const act = async (path: string, body: Record<string, unknown> = {}, after: 'next' | 'refresh' = 'next') => {
  if (busy.value || !detail.value) return
  busy.value = true
  message.value = ''
  try {
    const following = detail.value.neighbors.next
    const result = await $api<{ moved_to?: number, new_id?: number }>(`/v1/admin/harvest/candidates/${id.value}/${path}`, {
      method: 'POST', query: filters.value, body: { lock_version: detail.value.candidate.lock_version, ...body },
    })
    if (result?.moved_to) return go(result.moved_to)
    if (after === 'next' && following) return go(following)
    await refresh()
  } catch (e) {
    message.value = harvestError(e)
  } finally {
    busy.value = false
  }
}

const rejectPresets = computed(() => (tm('admin_pages.harvest.review.reject_presets') as unknown[]).map(item => rt(item as Parameters<typeof rt>[0])))
const rejectOpen = ref(false)
const rejectReason = ref('')
const reject = async () => {
  if (!rejectReason.value.trim()) return
  rejectOpen.value = false
  await act('reject', { reason: rejectReason.value.trim() })
  rejectReason.value = ''
}
const linkOpen = ref(false)
const mergeInto = ref('')

// ---- images: harvested copies are previewed from this site, the others fetched from the source on request; only the one picked is stored ----
const previews = reactive<Record<string, { src: string, width: number, height: number } | 'loading' | 'failed'>>({})
const showImages = ref(false)
const images = computed(() => detail.value?.candidate.merged.images ?? [])
const remoteCount = computed(() => images.value.filter(image => !image.local).length)
const shownImages = computed<HarvestMergedImage[]>(() => showImages.value ? images.value : images.value.filter(image => image.local))
const loadPreview = async (url: string) => {
  if (previews[url]) return
  previews[url] = 'loading'
  try {
    const blob = await $api<Blob>(`/v1/admin/harvest/candidates/${id.value}/preview`, { query: { url }, responseType: 'blob' })
    const src = URL.createObjectURL(blob)
    const size = await new Promise<{ width: number, height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = src
    })
    previews[url] = { src, ...size }
  } catch {
    previews[url] = 'failed'
  }
}
// Previews are made in the browser (object URLs), so after mounting.
onMounted(() => {
  watch(shownImages, (list) => {
    for (const image of list) void loadPreview(image.url)
  }, { immediate: true })
})
onBeforeUnmount(() => {
  for (const preview of Object.values(previews)) if (typeof preview === 'object') URL.revokeObjectURL(preview.src)
})
const coverNote = ref('')
const useCover = async (url: string) => {
  if (busy.value || !editor.value) return
  busy.value = true
  message.value = ''
  coverNote.value = ''
  try {
    const image = await $api<CatalogImage>(`/v1/admin/harvest/candidates/${id.value}/images`, { method: 'POST', body: { url } })
    editor.value.remember('images', image.id, image)
    setCover(editor.value.album, image.id)
    coverNote.value = t('admin_pages.harvest.review.cover_set', { width: image.width ?? '?', height: image.height ?? '?' })
  } catch (e) {
    message.value = harvestError(e)
  } finally {
    busy.value = false
  }
}
const sizeNote = (preview: { width: number, height: number }) => [
  Math.abs(preview.width - preview.height) > Math.max(preview.width, preview.height) * 0.01 ? t('admin_pages.harvest.review.not_square') : null,
  Math.min(preview.width, preview.height) < 500 ? t('admin_pages.harvest.review.too_small') : null,
].filter(Boolean).join('，')

const useTitle = (value: string) => { if (editor.value) editor.value.album.title = value }
const eventName = (eventId: number) => detail.value?.events.find(event => event.id === eventId)?.name ?? `#${eventId}`
const listingNote = (listing: Record<string, unknown> | null) => [
  typeof listing?.event === 'string' ? listing.event : null,
  listing?.resale === true ? t('admin_pages.harvest.review.listing_resale') : null,
].filter(Boolean).join(' · ')
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'

// Shortcuts outside text fields: J next, K previous, R not collected, S to the submit section.
const onKey = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (event.ctrlKey || event.metaKey || event.altKey || target?.closest('input, textarea, select, [contenteditable="true"]')) return
  const key = event.key.toLowerCase()
  if (key === 'j') next()
  else if (key === 'k') previous()
  else if (key === 'r' && open.value) rejectOpen.value = true
  else if (key === 's' && open.value) editor.value?.go('submit')
  else return
  event.preventDefault()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
useHead({ title: computed(() => detail.value?.candidate.title ?? t('admin_pages.harvest.review.title')) })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <AdminListState :pending="pending && !detail" :error="error" @retry="refresh()">
      <template v-if="detail">
        <header class="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <NuxtLink :to="{ path: '/admin/harvest', query: filters }" class="text-sm text-slate-500 hover:underline">← {{ t('admin_pages.harvest.review.back') }}</NuxtLink>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{{ detail.candidate.title }}</p>
            <p class="text-xs text-slate-500">
              <span :class="{ 'text-amber-700': !detail.event }">{{ detail.event?.name ?? t('admin_pages.harvest.no_event') }}</span> · {{ t(`admin_pages.harvest.status.${detail.candidate.status}`) }}
              <template v-if="detail.neighbors.position"> · {{ t('admin_pages.harvest.review.position', { position: detail.neighbors.position, total: detail.neighbors.total }) }}</template>
            </p>
          </div>
          <div class="flex flex-wrap gap-2 text-sm">
            <button type="button" class="rounded-lg border px-3 py-1.5" :disabled="!detail.neighbors.previous" @click="previous">{{ t('admin_pages.harvest.review.previous') }}</button>
            <button type="button" class="rounded-lg border px-3 py-1.5" :disabled="!detail.neighbors.next" @click="next">{{ open ? t('admin_pages.harvest.review.skip') : t('admin_pages.harvest.review.next') }}</button>
            <template v-if="open">
              <button type="button" class="rounded-lg border border-red-200 px-3 py-1.5 text-red-700" :disabled="busy" @click="rejectOpen = true">{{ t('admin_pages.harvest.review.reject') }}</button>
              <button type="button" class="rounded-lg border px-3 py-1.5" :disabled="busy" @click="linkOpen = !linkOpen">{{ t('admin_pages.harvest.review.link') }}</button>
            </template>
            <button v-else-if="['rejected', 'linked', 'excluded'].includes(detail.candidate.status)" type="button" class="rounded-lg border px-3 py-1.5" :disabled="busy" @click="act('restore', {}, 'refresh')">{{ t('admin_pages.harvest.review.restore') }}</button>
          </div>
        </header>
        <p class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.shortcuts') }}</p>
        <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

        <div v-if="!open" class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <p>{{ t('admin_pages.harvest.review.closed', { status: t(`admin_pages.harvest.status.${detail.candidate.status}`) }) }}
            <template v-if="detail.candidate.album">{{ t('admin_pages.harvest.review.approved') }}<NuxtLink :to="`/albums/${detail.candidate.album.id}`" class="text-sky-700 hover:underline">{{ detail.candidate.album.title }}</NuxtLink></template>
          </p>
          <p v-if="detail.candidate.reviewer" class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.by', { name: detail.candidate.reviewer.nickname || detail.candidate.reviewer.username, time: time(detail.candidate.reviewed_at) }) }}</p>
          <p v-if="detail.candidate.reject_reason" class="text-xs text-slate-600">{{ detail.candidate.reject_reason }}</p>
          <p v-if="detail.candidate.sources_changed_at" class="text-xs text-sky-800">{{ t('admin_pages.harvest.review.sources_changed') }}</p>
        </div>
        <div v-else-if="detail.candidate.release_kind !== 'first'" class="rounded-lg border px-4 py-2 text-sm" :class="detail.candidate.release_kind === 'resale' ? 'border-violet-200 bg-violet-50 text-violet-900' : 'border-amber-200 bg-amber-50 text-amber-900'">
          <template v-if="detail.candidate.release_kind === 'resale'">{{ t('admin_pages.harvest.review.resale') }}</template>
          <template v-else-if="detail.event">{{ t('admin_pages.harvest.review.unknown_release', { event: detail.event.name }) }}</template>
          <template v-else>{{ t('admin_pages.harvest.review.no_event_release') }}</template>
          <span v-if="detail.candidate.merged.release.reason" class="block text-xs">{{ t(`admin_pages.harvest.release_reason.${detail.candidate.merged.release.reason}`) }}</span>
          <span v-for="note in detail.candidate.merged.release.notes" :key="note" class="block text-xs">{{ note }}</span>
        </div>

        <form v-if="rejectOpen" class="flex flex-wrap items-end gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm" @submit.prevent="reject">
          <label class="min-w-64 flex-1">{{ t('admin_pages.harvest.review.reject_reason') }}<input v-model="rejectReason" required maxlength="500" class="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"></label>
          <button v-for="preset in rejectPresets" :key="preset" type="button" class="rounded border bg-white px-2 py-1 text-xs" @click="rejectReason = preset">{{ preset }}</button>
          <button type="submit" class="rounded bg-red-700 px-3 py-1.5 text-white" :disabled="busy">{{ t('admin_pages.harvest.review.reject') }}</button>
          <button type="button" class="rounded border px-3 py-1.5" @click="rejectOpen = false">{{ t('common.cancel') }}</button>
        </form>
        <div v-if="linkOpen" class="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <p class="font-medium">{{ t('admin_pages.harvest.review.link_title') }}</p>
          <p class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.link_help') }}</p>
          <EditorEntityPicker kind="album" :placeholder="t('admin_pages.harvest.review.link_pick')" class="max-w-md" @select="act('link', { album_id: $event.id })" />
        </div>

        <details class="rounded-xl border border-slate-200 bg-white" open>
          <summary class="cursor-pointer px-4 py-3 font-semibold">{{ t('admin_pages.harvest.review.panel') }}</summary>
          <div class="grid gap-4 border-t border-slate-100 p-4 text-sm lg:grid-cols-2">
            <section class="space-y-2">
              <h3 class="font-medium">{{ t('admin_pages.harvest.review.sources') }}</h3>
              <ul class="space-y-1">
                <li v-for="record in detail.records" :key="`${record.record_id}-${record.part}`" class="flex flex-wrap items-baseline gap-2">
                  <span class="rounded bg-slate-100 px-1.5 text-xs">{{ record.label }}</span>
                  <a :href="record.url" target="_blank" rel="noopener noreferrer" class="min-w-0 max-w-full truncate text-sky-700 hover:underline">{{ record.title }}</a>
                  <span v-if="record.gone" class="text-xs text-red-700">{{ t('admin_pages.harvest.review.gone') }}</span>
                  <span v-if="record.delisted" class="text-xs text-amber-700">{{ t('admin_pages.harvest.review.delisted') }}</span>
                  <span class="text-xs text-slate-400">{{ t('admin_pages.harvest.review.fetched', { time: time(record.fetched_at) }) }}</span>
                  <button v-if="open && detail.records.length > 1" type="button" class="text-xs underline" :disabled="busy" @click="act('split', { record_id: record.record_id, part: record.part }, 'refresh')">{{ t('admin_pages.harvest.review.split') }}</button>
                  <ul v-if="record.listings.length || record.events.length" class="w-full space-y-0.5 pl-4 text-xs text-slate-500">
                    <li v-for="listing in record.listings" :key="listing.task.id">
                      {{ t('admin_pages.harvest.review.listed_by') }}
                      <a v-if="listing.task.url" :href="listing.task.url" target="_blank" rel="noopener noreferrer" class="text-sky-700 hover:underline">{{ listing.task.label ?? listing.task.key }}</a>
                      <template v-else>{{ listing.task.label ?? listing.task.key }}</template>
                      （{{ listing.task.source_label }} · {{ listing.task.entry_label }}）
                      <template v-if="listingNote(listing.listing)"> · {{ listingNote(listing.listing) }}</template>
                      <span v-if="listing.delisted_at" class="text-amber-700"> · {{ t('admin_pages.harvest.review.delisted') }}</span>
                    </li>
                    <li v-if="record.events.length">
                      {{ t('admin_pages.harvest.review.linked_to') }}
                      <template v-for="(link, index) in record.events" :key="link.event_id">{{ index ? '、' : '' }}{{ eventName(link.event_id) }}（{{ t(`admin_pages.harvest.via.${link.via}`) }}）</template>
                    </li>
                  </ul>
                </li>
              </ul>
              <h3 class="pt-2 font-medium">{{ t('admin_pages.harvest.review.events') }}</h3>
              <p v-if="!detail.events.length" class="text-xs text-amber-700">{{ t('admin_pages.harvest.review.no_events') }}</p>
              <ul v-else class="space-y-1 text-xs">
                <li v-for="event in detail.events" :key="event.id" class="flex flex-wrap items-baseline gap-2">
                  <span class="font-medium" :class="{ 'text-slate-900': event.suggested }">{{ event.name }}</span>
                  <span class="text-slate-500">{{ event.start_date }}</span>
                  <span class="rounded bg-slate-100 px-1.5">{{ t(`admin_pages.harvest.via.${event.via}`) }}</span>
                  <span v-if="event.suggested" class="rounded bg-emerald-50 px-1.5 text-emerald-800">{{ t('admin_pages.harvest.review.suggested') }}</span>
                  <span v-if="event.event_circle" class="text-slate-500">{{ t('admin_pages.harvest.review.event_circle', { space: event.event_circle.space_code ?? '—' }) }}</span>
                </li>
              </ul>
              <p v-if="detail.candidate.merged.event_hints.length" class="flex flex-wrap gap-1 text-xs">
                <span class="text-slate-500">{{ t('admin_pages.harvest.review.event_hints') }}</span>
                <span v-for="hint in detail.candidate.merged.event_hints" :key="hint.text" class="rounded bg-slate-100 px-1.5" :title="hint.sources.join(', ')">{{ hint.text }}</span>
              </p>
              <h3 class="pt-2 font-medium">{{ t('admin_pages.harvest.review.circle') }}</h3>
              <p v-if="detail.candidate.artist_id || detail.candidate.circle_name">
                {{ detail.candidate.circle_name }}
                <span v-if="detail.event_circle" class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.event_circle', { space: detail.event_circle.space_code ?? '—' }) }}</span>
              </p>
              <p v-if="!detail.candidate.artist_id" class="text-xs text-amber-700">{{ t('admin_pages.harvest.review.circle_unknown') }}</p>

              <template v-if="detail.duplicates.length">
                <h3 class="pt-2 font-medium">{{ t('admin_pages.harvest.review.duplicates') }}</h3>
                <ul class="space-y-1">
                  <li v-for="dup in detail.duplicates" :key="dup.album_id" class="flex flex-wrap items-baseline gap-2">
                    <span class="rounded px-1.5 text-xs" :class="dup.strength === 'strong' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-800'">{{ dup.strength === 'strong' ? t('admin_pages.harvest.review.strong') : t('admin_pages.harvest.review.weak') }}</span>
                    <NuxtLink :to="`/albums/${dup.album_id}`" target="_blank" class="text-sky-700 hover:underline">{{ dup.album?.title ?? `#${dup.album_id}` }}</NuxtLink>
                    <span class="text-xs text-slate-500">{{ dup.album?.catalog_number }}</span>
                    <button v-if="open" type="button" class="text-xs underline" :disabled="busy" @click="act('link', { album_id: dup.album_id })">{{ t('admin_pages.harvest.review.same_album') }}</button>
                  </li>
                </ul>
              </template>

              <form v-if="open" class="flex flex-wrap items-end gap-2 pt-2 text-xs" @submit.prevent="mergeInto && act('merge', { into_id: Number(mergeInto) })">
                <label>{{ t('admin_pages.harvest.review.merge') }}<input v-model="mergeInto" inputmode="numeric" class="mt-1 block w-28 rounded border border-slate-300 px-2 py-1"></label>
                <button type="submit" class="rounded border px-2 py-1" :disabled="busy || !mergeInto">{{ t('admin_pages.harvest.review.merge_go') }}</button>
                <span class="text-slate-500">{{ t('admin_pages.harvest.review.merge_help') }}</span>
              </form>
            </section>

            <section class="space-y-2">
              <h3 class="font-medium">{{ t('admin_pages.harvest.review.fields') }}</h3>
              <dl class="space-y-1">
                <div v-if="detail.candidate.merged.title.alternatives.length">
                  <dt class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.title') }}</dt>
                  <dd v-for="alt in [{ value: detail.candidate.merged.title.value, source: detail.candidate.merged.title.source }, ...detail.candidate.merged.title.alternatives]" :key="`${alt.source}-${alt.value}`" class="flex gap-2">
                    <span class="text-xs text-slate-400">{{ alt.source }}</span><span class="min-w-0 flex-1">{{ alt.value }}</span>
                    <button v-if="open && alt.value" type="button" class="text-xs underline" @click="useTitle(alt.value)">{{ t('admin_pages.harvest.review.use') }}</button>
                  </dd>
                </div>
                <div v-if="detail.candidate.merged.catalog_numbers.value?.length">
                  <dt class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.catalog_numbers') }}</dt>
                  <dd class="font-mono text-xs">{{ detail.candidate.merged.catalog_numbers.value.join(' / ') }}<span v-for="alt in detail.candidate.merged.catalog_numbers.alternatives" :key="alt.source" class="ml-2 text-slate-500">{{ alt.source }}: {{ alt.value.join(' / ') }}</span></dd>
                </div>
                <div v-if="detail.candidate.merged.price.value">
                  <dt class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.price') }}</dt>
                  <dd class="text-xs">{{ detail.candidate.merged.price.value.amount }} {{ detail.candidate.merged.price.value.currency }}<span v-for="alt in detail.candidate.merged.price.alternatives" :key="alt.source" class="ml-2 text-slate-500">{{ alt.source }}: {{ alt.value.amount }}</span></dd>
                </div>
                <div v-if="detail.candidate.merged.tracklist.alternatives.length">
                  <dt class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.tracklists') }}</dt>
                  <dd v-for="alt in detail.candidate.merged.tracklist.alternatives" :key="`${alt.record_id}-${alt.part}`" class="text-xs">{{ t('admin_pages.harvest.review.tracks_count', { source: alt.source, count: alt.tracks }) }}</dd>
                </div>
              </dl>

              <h3 class="pt-2 font-medium">{{ t('admin_pages.harvest.review.covers') }}</h3>
              <p class="text-xs text-slate-500">{{ t('admin_pages.harvest.review.covers_help') }}</p>
              <p v-if="coverNote" class="text-xs text-emerald-700">{{ coverNote }}</p>
              <button v-if="!showImages && remoteCount" type="button" class="rounded border px-2 py-1 text-xs" @click="showImages = true">{{ t('admin_pages.harvest.review.load_images') }}（{{ remoteCount }}）</button>
              <div v-if="shownImages.length" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <figure v-for="image in shownImages" :key="image.url" class="space-y-1 rounded border border-slate-200 p-1 text-xs">
                  <div class="flex aspect-square items-center justify-center overflow-hidden bg-slate-50">
                    <img v-if="typeof previews[image.url] === 'object'" :src="(previews[image.url] as { src: string }).src" alt="" class="max-h-full max-w-full object-contain">
                    <span v-else class="text-slate-400">{{ previews[image.url] === 'failed' ? '×' : '…' }}</span>
                  </div>
                  <figcaption class="flex flex-wrap items-center gap-1">
                    <span class="text-slate-500">{{ image.source }}</span>
                    <span v-if="image.local" class="rounded bg-emerald-50 px-1 text-emerald-800">{{ t('admin_pages.harvest.review.local') }}</span>
                    <template v-if="typeof previews[image.url] === 'object'">
                      <span>{{ (previews[image.url] as { width: number }).width }}×{{ (previews[image.url] as { height: number }).height }}</span>
                      <span class="text-amber-700">{{ sizeNote(previews[image.url] as { width: number, height: number }) }}</span>
                    </template>
                    <button v-if="open" type="button" class="ml-auto underline" :disabled="busy || !editor" @click="useCover(image.url)">{{ t('admin_pages.harvest.review.use_cover') }}</button>
                  </figcaption>
                </figure>
              </div>

              <details v-if="detail.candidate.merged.descriptions.length" class="pt-2">
                <summary class="cursor-pointer font-medium">{{ t('admin_pages.harvest.review.descriptions') }}</summary>
                <div v-for="text in detail.candidate.merged.descriptions" :key="text.record_id" class="mt-2">
                  <p class="text-xs text-slate-500">{{ text.source }}</p>
                  <p class="max-h-48 overflow-y-auto whitespace-pre-line rounded bg-slate-50 p-2 text-xs">{{ text.text }}</p>
                </div>
              </details>
              <div v-if="detail.candidate.merged.notes.length" class="pt-2 text-xs text-slate-600">
                <p class="font-medium">{{ t('admin_pages.harvest.review.notes') }}</p>
                <p v-for="note in detail.candidate.merged.notes" :key="note">{{ note }}</p>
              </div>
            </section>
          </div>
        </details>

        <template v-if="open">
          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{{ t('admin_pages.harvest.review.submit_hint') }}</span>
            <button type="button" class="underline" @click="prepareDraft(true)">{{ t('admin_pages.harvest.review.rebuild') }}</button>
          </div>
          <LazyEditorAlbumEditor v-if="draftReady" :key="editorKey" ref="editor" :draft-scope="scope" embedded :submit-to="approve" @submitted="approved" @discarded="prepareDraft(true)" />
        </template>
      </template>
    </AdminListState>
  </div>
</template>
