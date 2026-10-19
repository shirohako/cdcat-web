<template>
  <div ref="root" class="scroll-mt-20">
    <div v-if="!circles.length" class="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
      <SearchX :size="28" class="text-slate-300" />
      {{ t('event_page.circles.empty') }}
    </div>

    <template v-else>
      <!-- Block index, by hall: jumps to the page and heading of a block -->
      <nav class="sticky top-16 z-20 -mx-1 mb-4 space-y-1.5 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.4)] backdrop-blur" :aria-label="t('event_page.circles.index')">
        <div v-for="group in index" :key="group.hall" class="flex items-start gap-2">
          <span class="w-24 shrink-0 truncate pt-1 text-[11px] font-semibold text-slate-500 sm:w-28" :title="group.hall">{{ group.hall || t('event_page.circles.off_map') }}</span>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="block in group.blocks"
              :key="block.key"
              type="button"
              class="min-w-7 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-colors"
              :class="pageBlocks.has(block.key) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              :title="t('event_page.circles.block_count', { block: block.label, count: block.circles.length })"
              @click="jump(block.key)"
            >
              {{ block.area ? block.label : '…' }}
            </button>
          </div>
        </div>
      </nav>

      <div class="space-y-6">
        <section v-for="part in pageParts" :id="`circle-block-${part.block.key}`" :key="part.block.key" class="scroll-mt-44">
          <h3 class="mb-2.5 flex items-baseline gap-2 px-1">
            <span class="text-lg font-extrabold text-slate-900">{{ part.block.label }}</span>
            <span v-if="part.block.hall" class="text-xs text-slate-500">{{ part.block.hall }}</span>
            <span class="text-xs text-slate-400">· {{ t('event_page.circles.count', { count: part.block.circles.length }) }}</span>
            <span v-if="part.continued" class="text-xs text-slate-400">{{ t('event_page.circles.continued') }}</span>
          </h3>
          <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <li
              v-for="circle in part.circles"
              :key="circle.id"
              class="group relative flex cursor-pointer gap-3 rounded-2xl border bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-18px_rgba(15,23,42,0.45)]"
              :class="circle.id === selectedId ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'"
              @click="$emit('select', circle.id)"
            >
              <div class="relative size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <img v-if="circle.image_url" :src="circle.image_url" :alt="circle.name" loading="lazy" class="h-full w-full object-cover">
                <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><Users :size="26" /></div>
                <span class="absolute inset-x-0 bottom-0 h-1" :style="{ background: familyColor(circle) }" />
              </div>
              <div class="min-w-0 flex-1 py-0.5">
                <span class="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">{{ circle.space_code ?? t('event_page.circle.catalog_only') }}</span>
                <p class="mt-1 line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-blue-600">{{ circle.name }}</p>
                <p class="line-clamp-1 text-xs text-slate-500">{{ circle.description || circle.name_kana }}</p>
                <div class="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span v-if="circle.genre" class="inline-flex min-w-0 items-center gap-1 truncate">
                    <span class="size-1.5 shrink-0 rounded-full" :style="{ background: familyColor(circle) }" />{{ genreShortLabel(circle.genre, genres) }}
                  </span>
                  <span v-if="circle.album_ids.length" class="inline-flex shrink-0 items-center gap-0.5 text-blue-600"><Disc3 :size="12" />{{ circle.album_ids.length }}</span>
                </div>
              </div>
              <button
                type="button"
                class="absolute right-2 top-2 rounded-full p-1.5 transition-colors"
                :class="checked.has(circle.id) ? 'text-amber-500' : 'text-slate-300 opacity-0 hover:text-amber-500 group-hover:opacity-100 focus-visible:opacity-100'"
                :aria-pressed="checked.has(circle.id)"
                :aria-label="checked.has(circle.id) ? t('event_page.checklist.remove') : t('event_page.checklist.add')"
                @click.stop="$emit('toggle-check', circle.id)"
              >
                <Star :size="17" :fill="checked.has(circle.id) ? 'currentColor' : 'none'" />
              </button>
            </li>
          </ul>
        </section>
      </div>

      <div class="mt-6 flex flex-col items-center gap-2">
        <CommonPagination :page="page" :total-pages="totalPages" @update:page="goTo" />
        <p class="text-xs text-slate-400">{{ t('event_page.circles.range', { from: from + 1, to: Math.min(from + PER_PAGE, ordered.length), total: ordered.length }) }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EventCircle, VenueMapData } from '~/types/event'
import { Disc3, SearchX, Star, Users } from '@lucide/vue'

const PER_PAGE = 60

const props = defineProps<{
  /** Already filtered, in the organizer's order */
  circles: EventCircle[]
  genres: VenueMapData['genres']
  checked: ReadonlySet<number>
  selectedId: number | null
  /** circle id → hall name */
  halls: Map<number, string>
}>()
defineEmits<{ 'select': [id: number], 'toggle-check': [id: number] }>()
const { t } = useI18n()

interface Block { key: string, area: string | null, label: string, hall: string, circles: EventCircle[] }

// Blocks in the order they first appear; circles without a space (catalog-only) form the last one.
// A block's hall comes from its circles' desks on the map, so an area the map does not have has none.
const blocks = computed(() => {
  const byKey = new Map<string, Block>()
  for (const circle of props.circles) {
    const key = circle.area ?? ''
    let block = byKey.get(key)
    if (!block) {
      block = { key: key || '_', area: circle.area, label: circle.area ?? t('event_page.circle.catalog_only'), hall: props.halls.get(circle.id) ?? '', circles: [] }
      byKey.set(key, block)
    }
    block.circles.push(circle)
  }
  // Blocks on the map first, then areas the map does not have (coloured areas, 藍), then circles without a space.
  const list = [...byKey.values()]
  return [...list.filter(b => b.area && b.hall), ...list.filter(b => b.area && !b.hall), ...list.filter(b => !b.area)]
})
const ordered = computed(() => blocks.value.flatMap(b => b.circles))
const index = computed(() => {
  const groups: { hall: string, blocks: Block[] }[] = []
  for (const block of blocks.value) {
    const group = groups.find(g => g.hall === block.hall)
    if (group) group.blocks.push(block)
    else groups.push({ hall: block.hall, blocks: [block] })
  }
  return groups
})

const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(ordered.value.length / PER_PAGE)))
const from = computed(() => (page.value - 1) * PER_PAGE)
const pageParts = computed(() => {
  const items = ordered.value.slice(from.value, from.value + PER_PAGE)
  const parts: { block: Block, circles: EventCircle[], continued: boolean }[] = []
  for (const circle of items) {
    const key = circle.area ?? ''
    const last = parts.at(-1)
    if (last && (last.block.area ?? '') === key) {
      last.circles.push(circle)
    } else {
      const block = blocks.value.find(b => (b.area ?? '') === key)!
      parts.push({ block, circles: [circle], continued: block.circles[0] !== circle })
    }
  }
  return parts
})
const pageBlocks = computed(() => new Set(pageParts.value.map(p => p.block.key)))

const root = ref<HTMLElement | null>(null)
const goTo = (value: number) => {
  page.value = Math.min(Math.max(1, value), totalPages.value)
  root.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
const jump = async (key: string) => {
  const block = blocks.value.find(b => b.key === key)
  if (!block) return
  page.value = Math.floor(ordered.value.indexOf(block.circles[0]!) / PER_PAGE) + 1
  await nextTick()
  document.getElementById(`circle-block-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// New filters start again from the first page.
watch(() => props.circles.map(c => c.id).join(), () => (page.value = 1))
// A booth picked on the map turns the list to its page, without scrolling away from the map.
watch(() => props.selectedId, (id) => {
  if (!id) return
  const at = ordered.value.findIndex(c => c.id === id)
  if (at >= 0) page.value = Math.floor(at / PER_PAGE) + 1
})

const familyColor = (circle: EventCircle) => GENRE_FAMILIES.find(f => f.key === genreFamily(circle.genre, props.genres))?.color ?? '#cbd5e1'
</script>
