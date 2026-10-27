<template>
  <div ref="root" class="scroll-mt-20">
    <div v-if="!circles.length" class="card flex min-h-48 items-center justify-center">
      <UiEmpty :title="t('event_page.circles.empty')" :icon="SearchX" />
    </div>

    <template v-else>
      <!-- Block index, by hall: jumps to the page and heading of a block -->
      <nav class="sticky top-14 z-20 -mx-1 mb-4 space-y-1.5 rounded-2xl bg-card/80 p-2.5 ring-1 ring-line backdrop-blur" :aria-label="t('event_page.circles.index')">
        <div v-for="group in index" :key="group.hall" class="flex items-start gap-2">
          <span class="w-24 shrink-0 truncate pt-1 text-[11px] font-semibold text-meta sm:w-28" :title="group.hall">{{ group.hall || t('event_page.circles.off_map') }}</span>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="block in group.blocks"
              :key="block.key"
              type="button"
              class="min-w-7 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-colors duration-150 ease-out"
              :class="pageBlocks.has(block.key) ? 'bg-primary text-on-primary' : 'bg-btn text-btn-content hover:bg-btn-hover'"
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
            <span class="text-lg font-extrabold text-title">{{ part.block.label }}</span>
            <span v-if="part.block.hall" class="text-xs text-meta">{{ part.block.hall }}</span>
            <span class="text-xs text-meta">· {{ t('event_page.circles.count', { count: part.block.circles.length }) }}</span>
            <span v-if="part.continued" class="text-xs text-meta">{{ t('event_page.circles.continued') }}</span>
          </h3>
          <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <li
              v-for="circle in part.circles"
              :key="circle.id"
              class="card group relative flex cursor-pointer gap-3 p-3 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
              :class="{ 'ring-2 ring-primary': circle.id === selectedId }"
              @click="$emit('select', circle.id)"
            >
              <UiCover :src="circle.image_url" :alt="circle.name" :icon="Users" rounded="xl" class="size-20">
                <template #overlay>
                  <span class="absolute inset-x-0 bottom-0 h-1" :style="{ background: familyColor(circle) }" />
                </template>
              </UiCover>
              <div class="min-w-0 flex-1 py-0.5">
                <span class="rounded-md bg-title px-1.5 py-0.5 font-mono text-[11px] font-semibold text-page">{{ circle.space_code ?? t('event_page.circle.catalog_only') }}</span>
                <p class="mt-1 line-clamp-1 text-sm font-bold text-title transition-colors duration-150 ease-out group-hover:text-primary">{{ circle.name }}</p>
                <p class="line-clamp-1 text-xs text-meta">{{ circle.description || circle.name_kana }}</p>
                <div class="mt-1.5 flex items-center gap-2 text-[11px] text-meta">
                  <span v-if="circle.genre" class="inline-flex min-w-0 items-center gap-1 truncate">
                    <span class="size-1.5 shrink-0 rounded-full" :style="{ background: familyColor(circle) }" />{{ genreShortLabel(circle.genre, genres) }}
                  </span>
                  <span v-if="circle.album_ids.length" class="inline-flex shrink-0 items-center gap-0.5 text-primary"><Disc3 :size="12" />{{ circle.album_ids.length }}</span>
                </div>
              </div>
              <!-- The checklist's gold star -->
              <button
                type="button"
                class="absolute right-2 top-2 rounded-full p-1.5 transition-colors duration-150 ease-out"
                :class="checked.has(circle.id) ? 'text-amber-500 dark:text-amber-400' : 'text-faint opacity-0 hover:text-amber-500 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:text-amber-400'"
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
        <p class="text-xs text-meta">{{ t('event_page.circles.range', { from: from + 1, to: Math.min(from + PER_PAGE, ordered.length), total: ordered.length }) }}</p>
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

// No genre family: a quiet neutral that follows the theme.
const familyColor = (circle: EventCircle) => GENRE_FAMILIES.find(f => f.key === genreFamily(circle.genre, props.genres))?.color ?? 'var(--faint)'
</script>
