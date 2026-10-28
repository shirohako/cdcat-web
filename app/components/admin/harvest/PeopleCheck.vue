<script setup lang="ts">
import type { AlbumDocument } from '~/types/document'
import type { HarvestArtistReference, HarvestCircleMatch, HarvestMergedCredit, HarvestNewArtist, HarvestPerson } from '~/types/harvest'
import { albumPublisher, DRAFT_REF, linkPrintedName, peopleWarnings, sameName, setCirclePublisher, settleSuggestions, type PeopleWarning } from '~/utils/harvestPeople'

/**
 * 人员核对 on the review page (docs/harvest/README.md#人员): what the draft did with each credited
 * name and the circle, and the ones left to the reviewer — with the artists to choose between, or a
 * new artist — done straight in the embedded editor's draft.
 */
const props = defineProps<{
  people: HarvestPerson[]
  circle: HarvestCircleMatch | null
  credits: HarvestMergedCredit[]
  artists: Record<string, HarvestArtistReference>
  editor: {
    album: AlbumDocument
    createItem: (type: 'artist', document: Record<string, unknown>, prefix?: string) => string
    remember: (type: string, id: number, row: object) => void
  } | null
}>()

const reasons: Record<string, (warning: PeopleWarning) => string> = {
  namesake: warning => `站内有 ${warning.candidates.length} 位同名的艺术家，请选是哪一位，或者新建一位。`,
  conflict: () => '站内同名的艺术家在同一个数据库里是另一个人，多半只是撞名。',
  pending: () => '同名的艺术家还在审核中，请确认是不是同一位。',
  circle_only: () => '站内同名的只有社团，不一定是这个人。',
  person_only: () => '站内同名的是个人艺术家，可能是本人的个人社团。',
  shop: () => '像是商店名，社团名多半不带后面的商店字样。',
  short: () => '名字太短，很容易撞名。第一次需要人工确认，选择会记进名字对照，之后自动沿用。',
  suspect: () => '名字看起来带了多余的内容（网址、括号、职位或敬称），请核对后再关联或新建。',
}

const album = computed(() => props.editor?.album ?? null)
const warnings = computed(() => album.value ? peopleWarnings(album.value, props.people, props.circle) : [])
const open = computed(() => warnings.value.filter(warning => warning.open))
const artist = (id: number) => props.artists[String(id)]
const LINKING = ['linked', 'link', 'circle', 'name']
const counts = computed(() => ({
  linked: props.people.filter(person => LINKING.includes(person.state)).length + (['linked', 'name'].includes(props.circle?.state ?? '') ? 1 : 0),
  created: props.people.filter(person => person.state === 'new').length + (props.circle?.state === 'new' ? 1 : 0),
  manual: warnings.value.length,
}))

/** The roles and tracks a name is credited for, e.g. "作曲、编曲 · 曲目 1、2". */
const creditedFor = (names: string[]) => {
  const rows = props.credits.filter(credit => credit.role && names.some(name => sameName(name, credit.name)))
  const roles = [...new Set(rows.map(credit => credit.raw_role))].join('、')
  const tracks = [...new Set(rows.filter(credit => credit.track).map(credit => credit.track!.disc > 1 ? `${credit.track!.disc}-${credit.track!.number}` : String(credit.track!.number)))]
  return [roles, tracks.length ? `曲目 ${tracks.slice(0, 8).join('、')}${tracks.length > 8 ? ' …' : ''}` : null].filter(Boolean).join(' · ')
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
const pick = (warning: PeopleWarning, id: number) => {
  if (!album.value || !props.editor) return
  const row = artist(id)
  if (row) props.editor.remember('artist', id, row)
  if (warning.kind === 'circle') setCirclePublisher(album.value, id)
  linkPrintedName(album.value, warning.names, id, row?.name)
}
/** A new artist the reviewer asked for: created as it is, not checked again on approval. */
const createNew = (warning: PeopleWarning) => {
  if (!album.value || !props.editor || !warning.create) return
  const ref = props.editor.createItem('artist', clone(warning.create) as unknown as Record<string, unknown>)
  if (warning.kind === 'circle') setCirclePublisher(album.value, ref)
  linkPrintedName(album.value, warning.names, ref, warning.create.name)
}

// A draft made before the suggestions (or set back since) still has printed names the server settles.
const settleable = computed(() => {
  const doc = album.value
  if (!doc) return 0
  const printed = doc.credits.filter(row => row.artist_id === null && row.credited_as).map(row => row.credited_as!)
  const names = props.people.filter(person => ['linked', 'link', 'name', 'circle', 'new'].includes(person.state)
    && (person.artist_id || person.state === 'new' || person.follows_circle) && person.names.some(name => printed.some(text => sameName(text, name))))
  const circle = albumPublisher(doc) === null && ['linked', 'name', 'new'].includes(props.circle?.state ?? '') ? 1 : 0
  return names.length + circle
})
const settle = () => {
  if (!album.value || !props.editor) return
  for (const id of new Set([...props.people.map(person => person.artist_id), props.circle?.artist_id])) {
    const row = id ? artist(id) : undefined
    if (id && row) props.editor.remember('artist', id, row)
  }
  settleSuggestions(album.value, props.people, props.circle, id => artist(id)?.name,
    (document: HarvestNewArtist) => props.editor!.createItem('artist', clone(document) as unknown as Record<string, unknown>, DRAFT_REF))
}

/** What the draft did with a name the server settled. */
const outcome = (person: HarvestPerson) => {
  if (person.state === 'new') return '新建'
  if (person.state === 'ignored') return '保持署名（名字对照里忽略了它）'
  if (person.follows_circle) return '就是社团（和专辑一起新建）'
  return null
}
const settled = computed(() => props.people.filter(person => !warnings.value.some(warning => warning.key === person.key)))
const card = 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs'
</script>

<template>
  <section v-if="people.length || warnings.length" :class="card">
    <h3 class="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 font-semibold">
      <Icon name="lucide:user-check" class="size-4 text-slate-400" />人员核对
      <span class="text-xs font-normal text-slate-500">自动关联 {{ counts.linked }} · 新建 {{ counts.created }} · 需要人工 {{ counts.manual }}</span>
      <span v-if="open.length" class="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">还有 {{ open.length }} 个没处理</span>
      <span v-else-if="warnings.length" class="ml-auto rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">都处理好了</span>
    </h3>

    <div v-if="settleable" class="flex flex-wrap items-center gap-2 border-b border-sky-100 bg-sky-50 px-4 py-2 text-xs text-sky-900">
      <span>草稿里有 {{ settleable }} 个署名还没按建议关联或新建（草稿比建议早，或者被改回了署名）。</span>
      <UiButton size="xs" @click="settle">按建议处理</UiButton>
    </div>

    <ul v-if="warnings.length" class="divide-y divide-slate-100">
      <li v-for="warning in warnings" :key="warning.key" class="px-4 py-3">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span v-if="warning.open" class="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">{{ harvestPeopleWarningLabels[warning.state] ?? warning.state }}</span>
          <span v-else class="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800"><Icon name="lucide:check" class="size-3" />已处理</span>
          <span class="font-medium" :class="!warning.open && 'text-slate-500'">{{ warning.names[0] }}</span>
          <span v-if="warning.kind === 'circle'" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">社团</span>
          <span v-else class="text-xs text-slate-500">{{ creditedFor(warning.names) }}</span>
        </div>
        <template v-if="warning.open">
          <p class="mt-1 text-xs leading-5 text-slate-600">{{ reasons[warning.state]?.(warning) }}</p>
          <ul v-if="warning.candidates.length" class="mt-2 space-y-1.5">
            <li v-for="id in warning.candidates" :key="id" class="flex items-center gap-2.5 rounded-lg border border-slate-200 px-2.5 py-1.5">
              <img v-if="artist(id)?.image_url" :src="artist(id)!.image_url!" alt="" class="size-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200">
              <span v-else class="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">{{ Array.from(artist(id)?.name ?? '?')[0]?.toUpperCase() }}</span>
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-baseline gap-x-1.5 text-sm">
                  <NuxtLink :to="`/artists/${id}`" target="_blank" class="font-medium text-sky-700 hover:underline">{{ artist(id)?.name ?? `#${id}` }}</NuxtLink>
                  <span class="font-mono text-xs text-slate-500">#{{ id }}</span>
                  <span v-if="artist(id)?.type" class="text-xs text-slate-500">{{ artistTypeLabels[artist(id)!.type!] ?? artist(id)!.type }}</span>
                  <span v-if="artist(id)?.is_pending" class="rounded bg-amber-50 px-1 text-xs text-amber-800">待审核</span>
                </p>
                <p class="text-xs text-slate-500">
                  {{ artist(id)?.albums ?? 0 }} 张专辑
                  <template v-for="page in artist(id)?.pages ?? []" :key="page.url"> · <a :href="page.url" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ page.provider }}</a></template>
                </p>
              </div>
              <UiButton size="xs" class="shrink-0" :disabled="!editor" @click="pick(warning, id)">就是这位</UiButton>
            </li>
          </ul>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <UiButton v-if="warning.create" size="xs" :disabled="!editor" @click="createNew(warning)">新建「{{ warning.create.name }}」</UiButton>
            <span class="text-xs text-slate-400">也可以在编辑器的「{{ warning.kind === 'circle' ? '人员' : '制作人员' }}」里手动选；不处理就保持纯署名。</span>
          </div>
        </template>
      </li>
    </ul>

    <details v-if="settled.length" class="group/auto border-t border-slate-100">
      <summary class="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-xs text-slate-600">
        <Icon name="lucide:chevron-right" class="size-3.5 text-slate-400 transition-transform group-open/auto:rotate-90" />自动处理的 {{ settled.length }} 个名字
      </summary>
      <ul class="space-y-1 px-4 pb-3 text-xs">
        <li v-for="person in settled" :key="person.key" class="flex flex-wrap items-baseline gap-x-2">
          <span class="font-medium text-slate-700">{{ person.names[0] }}</span>
          <span class="text-slate-400">→</span>
          <span v-if="outcome(person)" class="text-slate-600">{{ outcome(person) }}</span>
          <template v-else-if="person.artist_id">
            <NuxtLink :to="`/artists/${person.artist_id}`" target="_blank" class="text-sky-700 hover:underline">{{ artist(person.artist_id)?.name ?? `#${person.artist_id}` }}</NuxtLink>
            <span class="font-mono text-slate-400">#{{ person.artist_id }}</span>
          </template>
          <span class="text-slate-400">{{ creditedFor(person.names) }}</span>
        </li>
      </ul>
    </details>
  </section>
</template>
