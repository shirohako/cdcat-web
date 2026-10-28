<script setup lang="ts">
import type { RevisionDraftPayload } from '~/composables/useRevisionDraft'
import type { CatalogImage } from '~/types/catalog'
import type { AlbumDocument } from '~/types/document'
import type { HarvestArtistReference, HarvestCandidateDetail, HarvestMergedImage } from '~/types/harvest'
import type { Revision } from '~/types/revision'
import { buildHarvestDraft } from '~/utils/harvestDraft'
import { harvestFilters } from '~/utils/harvestFilters'
import { peopleWarnings } from '~/utils/harvestPeople'
import { errorName } from '~/utils/revisionErrors'
import { ALBUM_REF } from '~/composables/useAlbumEditor'
import { draftKey, localDrafts } from '~/utils/localDrafts'
import { setCover } from '~/utils/albumDocument'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface EditorHandle {
  album: AlbumDocument
  remember: (type: string, id: number, row: object) => void
  createItem: (type: 'artist', document: Record<string, unknown>, prefix?: string) => string
  removeItem: (ref: string) => void
}

const { $api } = useNuxtApp()
const harvestCircleByLabels: Record<string, string> = {
  identity: '审核时记住的对应', handle: 'X 账号', url: '链接', name: '社团名', artist: '署名的人是参展社团',
  circle: '参展社团（同名）', contains: '参展社团（名字包含）', manual: '手动指定',
}
const harvestViaLabels: Record<string, string> = { fixed: '任务固定在这届', name: '活动名对上', date: '发售日期在活动内' }
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
  if (value && 'moved_to' in value) navigateTo({ path: `/admin/harvest/candidates/${value.moved_to}`, query: filters.value }, { replace: true })
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

const go = (target: number | null) => target && navigateTo({ path: `/admin/harvest/candidates/${target}`, query: filters.value })
const next = () => go(detail.value?.neighbors.next ?? null)
const previous = () => go(detail.value?.neighbors.previous ?? null)

// ---- people: who the credited names and the circle are here (docs/harvest/README.md#人员) ----

/** After an approval stopped on names that have namesakes by now: the people as the server sees them then. */
const peopleNow = ref<Pick<HarvestCandidateDetail, 'people' | 'circle_match' | 'references'> | null>(null)
watch(detail, () => { peopleNow.value = null })
const people = computed(() => peopleNow.value?.people ?? detail.value?.people ?? [])
const circleMatch = computed(() => peopleNow.value?.circle_match ?? detail.value?.circle_match ?? null)
const artistRefs = computed(() => ({ ...detail.value?.references.artist, ...peopleNow.value?.references.artist }) as unknown as Record<string, HarvestArtistReference>)
/** Printed names in the credits still left to the reviewer, flagged in the editor too. */
const nameNotes = computed(() => Object.fromEntries((editor.value ? peopleWarnings(editor.value.album, people.value, circleMatch.value) : [])
  .filter(warning => warning.open && warning.kind === 'person')
  .flatMap(warning => warning.names.map(name => [name, harvestPeopleWarningLabels[warning.state] ?? warning.state]))))

const { confirm } = useConfirm()
/** Submits the draft; names still left to the reviewer are confirmed first, and stay printed names. */
const approve = async (payload: RevisionDraftPayload) => {
  const document = payload.items.find(item => item.resource_type === 'album')?.document as unknown as AlbumDocument | undefined
  const left = document ? peopleWarnings(document, people.value, circleMatch.value).filter(warning => warning.open) : []
  if (left.length && !await confirm({
    title: `还有 ${left.length} 个名字没处理，仍然提交吗？`,
    description: `${left.map(warning => warning.names[0]).join('、')} 会保持纯署名${left.some(warning => warning.kind === 'circle') ? '，专辑也没有专辑艺人' : ''}。`,
    confirmText: '仍然提交',
  })) throw new DOMException('The reviewer went back to the names', 'AbortError')
  try {
    return await $api<Revision>(`/v1/admin/harvest/candidates/${id.value}/approve`, {
      method: 'POST', body: { ...payload, lock_version: detail.value?.candidate.lock_version },
    })
  } catch (error) {
    if (errorName(error) === 'HARVEST_ARTISTS_CHANGED') await artistsChanged(error)
    throw error
  }
}
/** Names the draft created that have namesakes by now go back to printed names, for the reviewer to choose. */
const artistsChanged = async (error: unknown) => {
  const refs = (error as { details?: { details?: { refs?: Array<{ ref: string }> } } }).details?.details?.refs ?? []
  for (const changed of refs) editor.value?.removeItem(changed.ref)
  const fresh = await $api<HarvestCandidateDetail | { moved_to: number }>(`/v1/admin/harvest/candidates/${id.value}`, { query: filters.value }).catch(() => null)
  if (fresh && 'candidate' in fresh) peopleNow.value = { people: fresh.people, circle_match: fresh.circle_match, references: fresh.references }
}
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

const rejectPresets = ['不是音乐', '周边或书籍', '重复的条目', '不是这届活动的作品']
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
    coverNote.value = `已设为封面（${image.width ?? '?'}×${image.height ?? '?'}）`
  } catch (e) {
    message.value = harvestError(e)
  } finally {
    busy.value = false
  }
}
const sizeNote = (preview: { width: number, height: number }) => [
  Math.abs(preview.width - preview.height) > Math.max(preview.width, preview.height) * 0.01 ? '不是正方形' : null,
  Math.min(preview.width, preview.height) < 500 ? '小于 500px' : null,
].filter(Boolean).join('，')

const useTitle = (value: string) => { if (editor.value) editor.value.album.title = value }
const useDescription = (value: string) => { if (editor.value) editor.value.album.description = value.trim() || null }
/** The site name of a source, as the records label it. */
const sourceName = (source: string) => detail.value?.records.find(record => record.source === source)?.label ?? source
/** The album's official sites, as the sources mark their links; opened from the sources card. */
const officialLinks = computed(() => [...new Map((detail.value?.candidate.merged.links ?? [])
  .filter(link => link.kind === 'official').map(link => [link.url, link])).values()])
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
/** Whether the field comparison has anything to show: what the sources disagree on, and the numbers and price. */
const comparesFields = computed(() => {
  const merged = detail.value?.candidate.merged
  return Boolean(merged && (merged.title.alternatives.length || merged.catalog_numbers.value?.length || merged.price.value || merged.tracklist.alternatives.length))
})
// Each group of the source comparison is a white card on the grey page, its title inside.
const card = 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs'
const cardHead = 'flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 font-semibold'
/** The linked circle's artist, from the references that come with the candidate. */
const circleArtist = computed(() => {
  const artistId = detail.value?.candidate.artist_id
  const row = artistId ? detail.value?.references.artist?.[artistId] : undefined
  return row as { id: number, name: string, type: string | null, image_url: string | null, is_pending: boolean } | undefined
})
const circleInitial = computed(() => Array.from((circleArtist.value?.name ?? detail.value?.candidate.circle_name ?? '?').trim())[0]?.toUpperCase() ?? '?')
const eventName = (eventId: number) => detail.value?.events.find(event => event.id === eventId)?.name ?? `#${eventId}`
const listingNote = (listing: Record<string, unknown> | null) => [
  typeof listing?.event === 'string' ? listing.event : null,
  listing?.resale === true ? '列表标为再贩' : null,
].filter(Boolean).join(' · ')
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'

useHead({ title: computed(() => detail.value?.candidate.title ?? '标题') })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <AdminListState :pending="pending && !detail" :error="error" @retry="refresh()">
      <template v-if="detail">
        <header class="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <NuxtLink :to="{ path: '/admin/harvest/candidates', query: filters }" class="text-sm text-slate-500 hover:underline">← 返回待审核候选</NuxtLink>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{{ detail.candidate.title }}</p>
            <p class="text-xs text-slate-500">
              <span :class="{ 'text-amber-700': !detail.event }">{{ detail.event?.name ?? '未关联活动' }}</span> · {{ harvestStatusLabels[detail.candidate.status] }}
              <template v-if="detail.neighbors.position"> · 第 {{ detail.neighbors.position }} / {{ detail.neighbors.total }} 条</template>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UiButton size="sm" :disabled="!detail.neighbors.previous" @click="previous">上一条</UiButton>
            <UiButton size="sm" :disabled="!detail.neighbors.next" @click="next">{{ open ? '跳过' : '下一条' }}</UiButton>
            <template v-if="open">
              <UiButton variant="danger-soft" size="sm" :disabled="busy" @click="rejectOpen = true">不收录</UiButton>
              <UiButton size="sm" :disabled="busy" @click="linkOpen = !linkOpen">站内已有</UiButton>
            </template>
            <UiButton v-else-if="['rejected', 'linked', 'excluded'].includes(detail.candidate.status)" size="sm" :disabled="busy" @click="act('restore', {}, 'refresh')">放回待审</UiButton>
          </div>
        </header>
        <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

        <div v-if="!open" class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <p>这条候选已经处理过（{{ harvestStatusLabels[detail.candidate.status] }}）。
            <template v-if="detail.candidate.album">已建档：<NuxtLink :to="`/albums/${detail.candidate.album.id}`" class="text-sky-700 hover:underline">{{ detail.candidate.album.title }}</NuxtLink></template>
          </p>
          <p v-if="detail.candidate.reviewer" class="text-xs text-slate-500">由 {{ detail.candidate.reviewer.nickname || detail.candidate.reviewer.username }} 于 {{ time(detail.candidate.reviewed_at) }} 处理</p>
          <p v-if="detail.candidate.reject_reason" class="text-xs text-slate-600">{{ detail.candidate.reject_reason }}</p>
          <p v-if="detail.candidate.sources_changed_at" class="text-xs text-sky-800">建档之后来源有更新。</p>
        </div>
        <p v-else-if="!detail.event" class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">没有记录关联到活动：请核对发行日期，需要时在编辑器里选上首发活动。</p>

        <form v-if="rejectOpen" class="flex flex-wrap items-end gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm" @submit.prevent="reject">
          <label class="min-w-64 flex-1">原因<input v-model="rejectReason" required maxlength="500" class="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"></label>
          <UiButton v-for="preset in rejectPresets" :key="preset" size="xs" @click="rejectReason = preset">{{ preset }}</UiButton>
          <UiButton type="submit" variant="danger" size="sm" :disabled="busy">不收录</UiButton>
          <UiButton size="sm" @click="rejectOpen = false">取消</UiButton>
        </form>
        <div v-if="linkOpen" class="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <p class="font-medium">关联到站内已有的专辑</p>
          <p class="text-xs text-slate-500">这张专辑已经在站内，候选会记录对应的专辑，不再建新的。</p>
          <EditorEntityPicker kind="album" placeholder="搜索专辑" class="max-w-md" @select="act('link', { album_id: $event.id })" />
        </div>

        <details class="group" open>
          <summary class="flex cursor-pointer list-none items-center gap-2 font-semibold">
            <Icon name="lucide:chevron-right" class="size-4 text-slate-400 transition-transform group-open:rotate-90" />
            来源对照
            <span class="text-xs font-normal text-slate-500">{{ detail.records.length }} 个来源 · {{ detail.events.length }} 届活动</span>
          </summary>
          <div class="mt-3 grid items-start gap-4 text-sm lg:grid-cols-2">
            <div class="min-w-0 space-y-4">
              <section :class="card">
                <h3 :class="cardHead">
                  <Icon name="lucide:link" class="size-4 text-slate-400" />来源<span class="text-xs font-normal text-slate-500">{{ detail.records.length }}</span>
                  <span v-if="officialLinks.length" class="ml-auto flex flex-wrap justify-end gap-1.5">
                    <UiButton
                      v-for="link in officialLinks.slice(0, 3)" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer"
                      size="xs" icon="lucide:globe" icon-right="lucide:external-link" class="font-normal"
                      :title="`专辑官网（${sourceName(link.source)} 给的链接）：${link.url}`"
                    >
                      官网<span v-if="officialLinks.length > 1" class="text-slate-500">· {{ host(link.url) }}</span>
                    </UiButton>
                  </span>
                </h3>
                <ul class="divide-y divide-slate-100">
                  <li v-for="record in detail.records" :key="`${record.record_id}-${record.part}`" class="px-4 py-3">
                    <div class="flex items-start gap-2">
                      <span class="mt-px shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{{ record.label }}</span>
                      <div class="min-w-0 flex-1">
                        <a :href="record.url" target="_blank" rel="noopener noreferrer" class="break-words font-medium text-sky-700 hover:underline">{{ record.title }}<Icon name="lucide:external-link" class="ml-1 inline size-3 align-[-1px] text-sky-600/70" /></a>
                        <p class="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
                          <span>抓取于 {{ time(record.fetched_at) }}</span>
                          <span v-if="record.gone" class="text-red-700">已消失</span>
                          <span v-if="record.delisted" class="text-amber-700">已下架</span>
                        </p>
                      </div>
                      <UiButton v-if="open && detail.records.length > 1" size="xs" class="shrink-0" :disabled="busy" @click="act('split', { record_id: record.record_id, part: record.part }, 'refresh')">拆成单独的候选</UiButton>
                    </div>
                    <dl v-if="record.listings.length || record.events.length" class="mt-2.5 grid grid-cols-[3rem_1fr] gap-x-2 gap-y-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5">
                      <template v-for="listing in record.listings" :key="listing.task.id">
                        <dt class="text-slate-500">任务</dt>
                        <dd class="min-w-0">
                          <a v-if="listing.task.url" :href="listing.task.url" target="_blank" rel="noopener noreferrer" class="text-sky-700 hover:underline">{{ listing.task.label ?? listing.task.key }}</a>
                          <template v-else>{{ listing.task.label ?? listing.task.key }}</template>
                          <span class="text-slate-500"> · {{ listing.task.source_label }} {{ listing.task.entry_label }}</span>
                          <span v-if="listingNote(listing.listing)" class="block text-slate-500">{{ listingNote(listing.listing) }}</span>
                          <span v-if="listing.delisted_at" class="block text-amber-700">已从这个任务的列表下架</span>
                        </dd>
                      </template>
                      <template v-if="record.events.length">
                        <dt class="text-slate-500">活动</dt>
                        <dd class="flex flex-wrap gap-x-3 gap-y-1">
                          <span v-for="link in record.events" :key="link.event_id">{{ eventName(link.event_id) }}<span class="text-slate-500">（{{ harvestViaLabels[link.via] }}）</span></span>
                        </dd>
                      </template>
                    </dl>
                  </li>
                </ul>
              </section>

              <section :class="card">
                <h3 :class="cardHead">
                  <Icon name="lucide:calendar" class="size-4 text-slate-400" />活动<span class="text-xs font-normal text-slate-500">{{ detail.events.length }}</span>
                </h3>
                <p v-if="!detail.events.length" class="px-4 py-3 text-xs text-amber-700">没有关联到任何活动。</p>
                <ul v-else class="divide-y divide-slate-100 text-xs">
                  <li v-for="event in detail.events" :key="event.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5" :class="event.suggested && 'bg-emerald-50/60'">
                    <span class="font-medium text-slate-900">{{ event.name }}</span>
                    <span class="tabular-nums text-slate-500">{{ event.start_date }}</span>
                    <span class="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{{ harvestViaLabels[event.via] }}</span>
                    <span v-if="event.event_booth" class="text-slate-500">摊位 {{ event.event_booth.space_code ?? '—' }}</span>
                    <span v-if="event.suggested" class="ml-auto inline-flex items-center gap-1">
                      <span class="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">建议</span>
                      <UiTooltip placement="top-end" class="w-80">
                        <span tabindex="0" aria-label="建议首发是什么" class="inline-flex cursor-help rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-sky-500">
                          <Icon name="lucide:circle-question-mark" class="size-3.5" />
                        </span>
                        <template #content>
                          <div class="space-y-1.5 text-xs leading-5">
                            <p class="font-semibold">建议首发</p>
                            <p>根据来源推测，这张专辑最可能是在这届活动首发的。</p>
                            <p>审核时，草稿的「首发活动」默认填这一届，可以在编辑器里改。</p>
                            <p>挑选顺序：先看「任务固定在这届」和「活动名对上」的活动，取开始最早的一届；都没有，再看「发售日期在活动内」的。</p>
                          </div>
                        </template>
                      </UiTooltip>
                    </span>
                  </li>
                </ul>
                <div v-if="detail.candidate.merged.event_hints.length" class="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs">
                  <span class="mr-1 text-slate-500">来源里的活动线索：</span>
                  <span v-for="hint in detail.candidate.merged.event_hints" :key="hint.text" class="rounded-md bg-white px-2 py-0.5 text-slate-700 shadow-xs ring-1 ring-slate-300" :title="hint.sources.map(sourceName).join('、')">{{ hint.text }}</span>
                </div>
              </section>

              <section :class="card">
                <h3 :class="cardHead">
                  <Icon name="lucide:users" class="size-4 text-slate-400" />社团
                </h3>
                <div class="flex items-start gap-3 px-4 py-3">
                  <NuxtLink v-if="detail.candidate.artist_id" :to="`/artists/${detail.candidate.artist_id}`" target="_blank" class="shrink-0" :aria-label="`打开艺术家页 #${detail.candidate.artist_id}`">
                    <img v-if="circleArtist?.image_url" :src="circleArtist.image_url" alt="" class="size-12 rounded-full object-cover ring-1 ring-slate-200">
                    <span v-else class="flex size-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500 ring-1 ring-slate-200">{{ circleInitial }}</span>
                  </NuxtLink>
                  <span v-else class="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                    <Icon name="lucide:user-round-x" class="size-5" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <NuxtLink v-if="detail.candidate.artist_id" :to="`/artists/${detail.candidate.artist_id}`" target="_blank" class="font-medium text-sky-700 hover:underline">{{ circleArtist?.name ?? detail.candidate.circle_name ?? '未知社团' }}</NuxtLink>
                      <span v-else class="font-medium">{{ detail.candidate.circle_name ?? '未知社团' }}</span>
                      <span v-if="detail.candidate.artist_id" class="font-mono text-xs text-slate-500">#{{ detail.candidate.artist_id }}</span>
                      <span v-if="circleArtist?.type" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{{ artistTypeLabels[circleArtist.type] ?? circleArtist.type }}</span>
                      <span v-if="circleArtist?.is_pending" class="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">待审核</span>
                    </p>
                    <dl v-if="detail.candidate.artist_id || detail.event_booth" class="mt-1.5 grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-0.5 text-xs leading-5">
                      <template v-if="detail.candidate.circle_name && circleArtist && detail.candidate.circle_name !== circleArtist.name">
                        <dt class="text-slate-500">来源写作</dt>
                        <dd>{{ detail.candidate.circle_name }}</dd>
                      </template>
                      <template v-if="detail.candidate.artist_id && detail.candidate.circle_by">
                        <dt class="text-slate-500">关联依据</dt>
                        <dd>{{ harvestCircleByLabels[detail.candidate.circle_by] ?? detail.candidate.circle_by }}</dd>
                      </template>
                      <template v-if="detail.event_booth">
                        <dt class="text-slate-500">摊位</dt>
                        <dd>
                          <template v-if="detail.candidate.merged.circle.event_id">{{ eventName(detail.candidate.merged.circle.event_id) }} · </template>
                          <span class="font-mono">{{ detail.event_booth.space_code ?? '—' }}</span>
                        </dd>
                      </template>
                    </dl>
                    <p v-if="!detail.candidate.artist_id" class="mt-1 text-xs text-amber-700">没有认出社团，请在「人员」里选择专辑艺人。</p>
                  </div>
                </div>
              </section>

              <section v-if="detail.duplicates.length" :class="card">
                <h3 :class="cardHead">
                  <Icon name="lucide:copy" class="size-4 text-slate-400" />站内疑似重复<span class="text-xs font-normal text-slate-500">{{ detail.duplicates.length }}</span>
                </h3>
                <ul class="divide-y divide-slate-100">
                  <li v-for="dup in detail.duplicates" :key="dup.album_id" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                    <span class="rounded px-1.5 py-0.5 text-xs" :class="dup.strength === 'strong' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-800'">{{ dup.strength === 'strong' ? '强匹配' : '标题相似' }}</span>
                    <NuxtLink :to="`/albums/${dup.album_id}`" target="_blank" class="min-w-0 text-sky-700 hover:underline">{{ dup.album?.title ?? `#${dup.album_id}` }}</NuxtLink>
                    <span v-if="dup.album?.catalog_number" class="font-mono text-xs text-slate-500">{{ dup.album.catalog_number }}</span>
                    <UiButton v-if="open" size="xs" class="ml-auto" :disabled="busy" @click="act('link', { album_id: dup.album_id })">就是这张</UiButton>
                  </li>
                </ul>
              </section>

              <form v-if="open" :class="card" @submit.prevent="mergeInto && act('merge', { into_id: Number(mergeInto) })">
                <h3 :class="cardHead">
                  <Icon name="lucide:merge" class="size-4 text-slate-400" /><label for="merge-into">合并到另一条候选</label>
                </h3>
                <div class="px-4 py-3 text-xs">
                  <p class="text-slate-500">填另一条候选的编号（列表里的 #数字，也是地址里的数字）。</p>
                  <div class="mt-2 flex gap-2">
                    <input id="merge-into" v-model="mergeInto" inputmode="numeric" placeholder="编号" class="w-28 rounded border border-slate-300 px-2 py-1">
                    <UiButton type="submit" size="xs" :disabled="busy || !mergeInto">合并</UiButton>
                  </div>
                </div>
              </form>
            </div>

            <div class="min-w-0 space-y-4">
              <section v-if="comparesFields" :class="card">
                <h3 :class="cardHead">
                  <Icon name="lucide:columns-2" class="size-4 text-slate-400" />字段对照
                </h3>
                <dl class="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2.5 px-4 py-3">
                  <template v-if="detail.candidate.merged.title.alternatives.length">
                    <dt class="pt-0.5 text-xs text-slate-500">标题</dt>
                    <dd class="space-y-1">
                      <div v-for="alt in [{ value: detail.candidate.merged.title.value, source: detail.candidate.merged.title.source }, ...detail.candidate.merged.title.alternatives]" :key="`${alt.source}-${alt.value}`" class="flex items-baseline gap-2">
                        <span class="w-16 shrink-0 truncate text-xs text-slate-500">{{ alt.source ? sourceName(alt.source) : '' }}</span>
                        <span class="min-w-0 flex-1 break-words">{{ alt.value }}</span>
                        <UiButton v-if="open && alt.value" size="xs" class="shrink-0" @click="useTitle(alt.value)">采用</UiButton>
                      </div>
                    </dd>
                  </template>
                  <template v-if="detail.candidate.merged.catalog_numbers.value?.length">
                    <dt class="pt-0.5 text-xs text-slate-500">编号</dt>
                    <dd class="space-y-0.5">
                      <p class="font-mono text-xs">{{ detail.candidate.merged.catalog_numbers.value.join(' / ') }}</p>
                      <p v-for="alt in detail.candidate.merged.catalog_numbers.alternatives" :key="alt.source" class="text-xs text-slate-500">{{ sourceName(alt.source) }}：<span class="font-mono">{{ alt.value.join(' / ') }}</span></p>
                    </dd>
                  </template>
                  <template v-if="detail.candidate.merged.price.value">
                    <dt class="pt-0.5 text-xs text-slate-500">价格</dt>
                    <dd class="space-y-0.5 text-xs">
                      <p class="tabular-nums">{{ detail.candidate.merged.price.value.amount }} {{ detail.candidate.merged.price.value.currency }}</p>
                      <p v-for="alt in detail.candidate.merged.price.alternatives" :key="alt.source" class="tabular-nums text-slate-500">{{ sourceName(alt.source) }}：{{ alt.value.amount }}</p>
                    </dd>
                  </template>
                  <template v-if="detail.candidate.merged.tracklist.alternatives.length">
                    <dt class="pt-0.5 text-xs text-slate-500">曲目表</dt>
                    <dd class="space-y-0.5 text-xs">
                      <p v-for="alt in detail.candidate.merged.tracklist.alternatives" :key="`${alt.record_id}-${alt.part}`">{{ sourceName(alt.source) }}：{{ alt.tracks }} 轨<span class="text-slate-500">（草稿用的是 {{ detail.candidate.merged.tracklist.source ? sourceName(detail.candidate.merged.tracklist.source) : '—' }}）</span></p>
                    </dd>
                  </template>
                </dl>
              </section>

              <section :class="card">
                <h3 :class="cardHead">
                  <Icon name="lucide:image" class="size-4 text-slate-400" />封面候选
                  <UiButton v-if="!showImages && remoteCount" size="xs" class="ml-auto font-normal" @click="showImages = true">取回其他来源的图片（{{ remoteCount }}）</UiButton>
                </h3>
                <div class="space-y-3 px-4 py-3">
                  <p class="text-xs leading-5 text-slate-500">采集器交来的图片直接显示；其他图片要点按钮由本站去取。点「设为封面」才会存进本站；封面要求正方形、至少 500px。</p>
                  <p v-if="coverNote" class="text-xs text-emerald-700">{{ coverNote }}</p>
                  <p v-if="!shownImages.length && !remoteCount" class="text-xs text-slate-400">来源里没有图片。</p>
                  <div v-if="shownImages.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <figure v-for="image in shownImages" :key="image.url" class="overflow-hidden rounded-lg border border-slate-200 text-xs">
                      <div class="flex aspect-square items-center justify-center bg-slate-50">
                        <img v-if="typeof previews[image.url] === 'object'" :src="(previews[image.url] as { src: string }).src" alt="" class="max-h-full max-w-full object-contain">
                        <span v-else class="text-slate-400">{{ previews[image.url] === 'failed' ? '取不到' : '…' }}</span>
                      </div>
                      <figcaption class="space-y-1 border-t border-slate-100 p-2">
                        <p class="flex flex-wrap items-center gap-1.5">
                          <span class="text-slate-600">{{ sourceName(image.source) }}</span>
                          <span v-if="image.local" class="rounded bg-emerald-50 px-1 text-emerald-800">本站已有</span>
                          <span v-if="typeof previews[image.url] === 'object'" class="ml-auto tabular-nums text-slate-500">{{ (previews[image.url] as { width: number }).width }}×{{ (previews[image.url] as { height: number }).height }}</span>
                        </p>
                        <p v-if="typeof previews[image.url] === 'object' && sizeNote(previews[image.url] as { width: number, height: number })" class="text-amber-700">{{ sizeNote(previews[image.url] as { width: number, height: number }) }}</p>
                        <UiButton v-if="open" size="xs" block :disabled="busy || !editor" @click="useCover(image.url)">设为封面</UiButton>
                      </figcaption>
                    </figure>
                  </div>
                </div>
              </section>

              <details v-if="detail.candidate.merged.descriptions.length" class="group/desc" :class="card">
                <summary class="flex cursor-pointer list-none items-center gap-2 bg-slate-50/70 px-4 py-2.5 font-semibold group-open/desc:border-b group-open/desc:border-slate-100">
                  <Icon name="lucide:file-text" class="size-4 text-slate-400" />来源描述
                  <Icon name="lucide:chevron-down" class="ml-auto size-4 text-slate-400 transition-transform group-open/desc:rotate-180" />
                </summary>
                <div class="space-y-3 px-4 py-3">
                  <p v-if="open && detail.candidate.merged.descriptions.length > 1" class="text-xs text-slate-500">草稿默认填第一条，点「采用」换成别的来源。</p>
                  <div v-for="text in detail.candidate.merged.descriptions" :key="text.record_id">
                    <p class="mb-1 flex items-center gap-2 text-xs text-slate-500">
                      {{ sourceName(text.source) }}
                      <UiButton v-if="open" size="xs" class="ml-auto" :disabled="!editor" @click="useDescription(text.text)">采用</UiButton>
                    </p>
                    <p class="max-h-48 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-3 text-xs leading-5">{{ text.text }}</p>
                  </div>
                </div>
              </details>

              <section v-if="detail.candidate.merged.notes.length" :class="card">
                <h3 :class="cardHead">
                  <Icon name="lucide:sticky-note" class="size-4 text-slate-400" />备注
                </h3>
                <ul class="list-disc space-y-0.5 py-3 pl-8 pr-4 text-xs leading-5 text-slate-600">
                  <li v-for="note in detail.candidate.merged.notes" :key="note">{{ note }}</li>
                </ul>
              </section>
            </div>
          </div>
        </details>

        <AdminHarvestPeopleCheck v-if="open && draftReady" :people="people" :circle="circleMatch" :credits="detail.candidate.merged.credits" :artists="artistRefs" :editor="editor" />

        <section v-if="open" :class="card">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <h2 class="flex items-center gap-2 font-semibold">
              <Icon name="lucide:disc-3" class="size-4 text-slate-400" />新建专辑
            </h2>
            <p class="min-w-0 flex-1 text-xs text-slate-500">资料核对完后，在「提交」一节提交，就会以你的名义建成专辑。</p>
            <UiButton size="xs" @click="prepareDraft(true)">按来源重新生成草稿</UiButton>
          </div>
          <div class="bg-slate-50">
            <LazyEditorAlbumEditor v-if="draftReady" :key="editorKey" ref="editor" :draft-scope="scope" embedded :submit-to="approve" :name-notes="nameNotes" @submitted="approved" @discarded="prepareDraft(true)" />
            <p v-else class="px-4 py-8 text-center text-xs text-slate-400">正在准备草稿…</p>
          </div>
        </section>
      </template>
    </AdminListState>
  </div>
</template>
