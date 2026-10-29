<template>
  <section class="card overflow-hidden">
    <!-- A 20px line instead of the title's usual 24px, so the gaps above and below it are what the padding says. -->
    <UiSectionTitle :title="$t('album.section.stats')" :icon="BarChart3" size="sm" class="px-5 pb-5 pt-4 [&_h2]:leading-5" />

    <div class="space-y-4 px-5 pb-5">
      <div class="grid grid-cols-2 gap-2">
        <!-- No tile behind them, the icons tinted in colours of their own; number and label on one line, centred in
             each half. -->
        <div v-for="item in figures" :key="item.label" class="flex min-w-0 items-center justify-center gap-2">
          <span class="grid size-6 shrink-0 place-items-center rounded-md" :class="item.tint">
            <component :is="item.icon" :size="13" />
          </span>
          <p class="flex min-w-0 items-baseline gap-1.5">
            <span class="truncate text-base font-bold leading-6 tabular-nums text-title">{{ number.format(item.value) }}</span>
            <span class="shrink-0 text-xs text-meta">{{ item.label }}</span>
          </p>
        </div>
      </div>

      <div class="border-t border-line/60 pt-4">
        <div class="mb-2.5 flex items-center justify-between text-xs text-meta">
          <span class="flex items-center gap-1.5 font-medium text-body">
            <ListChecks :size="14" class="shrink-0 text-primary" />
            {{ $t('album.stats.tracking') }}
          </span>
          <span class="tabular-nums">{{ $t('album.stats.tracking_total', { count: number.format(total) }, total) }}</span>
        </div>

        <!-- One bar split by status. Each part's hover area takes in the gap before it and reaches past the bar's
             edges, so moving along the bar never leaves the tooltips and theirs glides from part to part. -->
        <div class="-my-1.5 flex">
          <UiTooltip v-for="(segment, index) in segments" :key="segment.status" group="album-tracking" :offset="2" :text="`${segment.label} ${number.format(segment.count)} · ${segment.share}%`">
            <div
              class="box-content py-1.5 transition-[flex-grow] duration-300 ease-out"
              :class="[index > 0 && 'pl-0.5', segment.count > 0 ? 'min-w-2' : 'min-w-1']"
              :style="{ flex: `${segment.weight} 1 0%` }"
            >
              <div class="h-1.5" :class="[segment.bar, index === 0 && 'rounded-l-full', index === segments.length - 1 && 'rounded-r-full']" />
            </div>
          </UiTooltip>
        </div>

        <!-- The legend doubles as the visitor's own picker: a press picks that status, a press on the picked one takes
             it back. -->
        <ul class="mt-3 grid grid-cols-2 gap-2 text-xs">
          <!-- Five statuses in two columns: the last one takes the whole row rather than leave a hole. -->
          <li v-for="option in options" :key="option.status" class="last:odd:col-span-2">
            <button
              type="button"
              class="group flex w-full min-w-0 items-center gap-2 rounded-sm px-2.5 py-1.5 text-left transition-colors duration-150 disabled:cursor-default"
              :class="mine === option.status ? option.picked : option.idle"
              :aria-pressed="mine === option.status"
              :disabled="locked"
              @click="choose(option.status)"
            >
              <!-- Picked, the icon turns into a × on hover: a press takes the status back. -->
              <span class="grid size-3.5 shrink-0 place-items-center" :class="option.tone">
                <component :is="option.icon" :size="14" :stroke-width="mine === option.status ? 2.5 : 2" :class="mine === option.status && 'group-enabled:group-hover:hidden'" />
                <X v-if="mine === option.status" :size="14" :stroke-width="2.5" class="hidden group-enabled:group-hover:block" />
              </span>
              <span class="truncate" :class="mine === option.status ? 'font-semibold' : 'text-body'">{{ option.label }}</span>
              <span class="ml-auto tabular-nums" :class="mine === option.status ? 'font-semibold' : 'font-medium text-title'">{{ number.format(option.count) }}</span>
            </button>
          </li>
        </ul>

        <div class="mt-3 flex items-center gap-3 text-xs">
          <!-- The visitor's own status in one neutral tag (its icon; unmarked, a dashed circle), as tall and as round as
               the button beside it (btn-xs: 28px, 6px). -->
          <p v-if="!locked" class="inline-flex h-7 min-w-0 items-center gap-1.5 rounded-md bg-sunken px-2.5 ring-1 ring-inset ring-line">
            <component :is="mineOption?.icon ?? CircleDashed" :size="13" class="shrink-0" :class="mineOption?.tone ?? 'text-faint'" />
            <span v-if="mineOption" class="truncate">
              <span class="text-meta">{{ $t('album.stats.mine') }}</span>
              <span class="ml-1 font-medium text-title">{{ mineOption.label }}</span>
            </span>
            <span v-else class="truncate text-meta">{{ $t('album.stats.unmarked') }}</span>
          </p>
          <!-- In the theme colour, so it doesn't sit in a grey as pale as the page; the arrow steps on on hover. -->
          <UiButton
            to="/tracking"
            variant="primary"
            size="xs"
            :icon-right="ArrowRight"
            icon-class="size-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            class="group ml-auto shrink-0"
          >
            {{ $t('tracking.widget.manage') }}
          </UiButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlbumTrackingStats } from '~/types/album'
import type { TrackingStatus } from '~/types/tracking'
import type { Component } from 'vue'
import { ArrowRight, BarChart3, Bookmark, CircleCheck, CircleDashed, CircleX, Eye, Headphones, Heart, ListChecks, Package, X } from "@lucide/vue"

/** Views, likes and how many people track the album in each status, with the visitor picking their own there. */
const props = withDefaults(defineProps<{
  albumId: number
  viewsCount?: number
  favoritesCount?: number
  trackingStats?: AlbumTrackingStats
  /** The visitor's own status, when the album came with it */
  initialTracking?: { status: TrackingStatus } | null
  /** Awaiting review: the counts show, but no status can be picked yet */
  locked?: boolean
}>(), {
  viewsCount: 0,
  favoritesCount: 0,
  trackingStats: () => ({
    plan_to_listen: 0,
    completed: 0,
    wishlist: 0,
    owned: 0,
    dropped: 0,
  }),
  initialTracking: null,
})

/** The page moves the counts: one off `previous`, one onto `status`. */
const emit = defineEmits<{ tracked: [status: TrackingStatus | null, previous: TrackingStatus | null] }>()

const { t, locale } = useI18n()
const { isAuthenticated } = useAuth()
const { getAlbumTracking, setAlbumTracking, deleteAlbumTracking } = useTracking()
const { showToast } = useToast()
const { localizeError } = useLocalizedApiError()
const router = useRouter()
const route = useRoute()
const number = computed(() => new Intl.NumberFormat(locale.value))

// Colours of their own: the theme colour is a grey in the ink theme.
const figures = computed(() => [
  { icon: Eye, label: t('album.stats.viewed'), value: props.viewsCount, tint: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400' },
  { icon: Heart, label: t('album.stats.liked'), value: props.favoritesCount, tint: 'bg-red-500/10 text-red-500 dark:bg-red-400/15 dark:text-red-400' },
])

// Same order, icons and colours as everywhere else tracking shows. On hover a tile takes a wash of its own colour: a
// light grey there would look like the page showing through the card.
const STATUSES: { status: TrackingStatus, icon: Component, tone: string, bar: string, idle: string, picked: string }[] = [
  {
    status: 'plan_to_listen',
    icon: Headphones,
    tone: 'text-blue-500 dark:text-blue-400',
    bar: 'bg-blue-500 dark:bg-blue-400',
    idle: 'bg-sunken enabled:hover:bg-blue-500/[0.08] dark:enabled:hover:bg-blue-400/[0.12]',
    picked: 'bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-500/35 dark:bg-blue-400/15 dark:text-blue-200 dark:ring-blue-400/40',
  },
  {
    status: 'completed',
    icon: CircleCheck,
    tone: 'text-teal-500 dark:text-teal-400',
    bar: 'bg-teal-500 dark:bg-teal-400',
    idle: 'bg-sunken enabled:hover:bg-teal-500/[0.08] dark:enabled:hover:bg-teal-400/[0.12]',
    picked: 'bg-teal-500/10 text-teal-700 ring-1 ring-inset ring-teal-500/35 dark:bg-teal-400/15 dark:text-teal-200 dark:ring-teal-400/40',
  },
  {
    status: 'wishlist',
    icon: Bookmark,
    tone: 'text-orange-400',
    bar: 'bg-orange-400',
    idle: 'bg-sunken enabled:hover:bg-orange-400/[0.12] dark:enabled:hover:bg-orange-400/[0.12]',
    picked: 'bg-orange-400/15 text-orange-700 ring-1 ring-inset ring-orange-400/45 dark:text-orange-200 dark:ring-orange-400/40',
  },
  {
    status: 'owned',
    icon: Package,
    tone: 'text-purple-500 dark:text-purple-400',
    bar: 'bg-purple-500 dark:bg-purple-400',
    idle: 'bg-sunken enabled:hover:bg-purple-500/[0.08] dark:enabled:hover:bg-purple-400/[0.12]',
    picked: 'bg-purple-500/10 text-purple-700 ring-1 ring-inset ring-purple-500/35 dark:bg-purple-400/15 dark:text-purple-200 dark:ring-purple-400/40',
  },
  // Not a colour of its own: neutral, a clearly darker grey on hover than any theme's page.
  {
    status: 'dropped',
    icon: CircleX,
    tone: 'text-meta',
    bar: 'bg-faint',
    idle: 'bg-sunken enabled:hover:bg-black/[0.08] dark:enabled:hover:bg-white/[0.1]',
    picked: 'bg-black/[0.08] text-title ring-1 ring-inset ring-faint dark:bg-white/[0.1]',
  },
]

const options = computed(() => STATUSES.map(option => ({
  ...option,
  label: t(`album.stats.${option.status}`),
  count: props.trackingStats[option.status] ?? 0,
})))
const total = computed(() => options.value.reduce((sum, option) => sum + option.count, 0))
/** Percent of the people tracking, as shown: under one but not none reads "<1". */
const shareOf = (count: number) => {
  const share = total.value > 0 ? (count / total.value) * 100 : 0
  return count > 0 && share < 1 ? '<1' : String(Math.round(share))
}
// Shares of the people tracking; while nobody does, every status gets an equal part. A status nobody picked keeps a
// sliver of its colour (min-w-1), narrower than any status somebody picked (min-w-2).
const segments = computed(() => options.value.map(option => ({
  ...option,
  weight: total.value === 0 ? 1 : option.count,
  share: shareOf(option.count),
})))

const mine = ref<TrackingStatus | null>(props.initialTracking?.status ?? null)
const mineOption = computed(() => options.value.find(option => option.status === mine.value))
const saving = ref(false)
// The page may swap in a fresher copy of the album after this has rendered (revisit cache).
watch(() => props.initialTracking?.status ?? null, (status) => {
  if (!saving.value) mine.value = status
})

const fetchMine = async () => {
  if (!isAuthenticated.value || mine.value !== null) return
  try {
    mine.value = (await getAlbumTracking(props.albumId)).status
  } catch (error) {
    console.error('Failed to fetch tracking status:', error)
  }
}

/** Picks a status, or takes back the one already picked. The counts move at once, and back if saving fails. */
const choose = async (status: TrackingStatus) => {
  if (props.locked || saving.value) return
  if (!isAuthenticated.value) {
    router.push({ path: '/auth/login', query: { redirect: route.fullPath } })
    return
  }
  const previous = mine.value
  const next = previous === status ? null : status
  saving.value = true
  mine.value = next
  emit('tracked', next, previous)
  try {
    if (next) await setAlbumTracking(props.albumId, next)
    else if (!(await deleteAlbumTracking(props.albumId))) throw new Error('Failed to remove tracking')
  } catch (error) {
    mine.value = previous
    emit('tracked', previous, next)
    showToast(localizeError(error), 'error')
  } finally {
    saving.value = false
  }
}

// On client-side navigation start at once; after a server render, wait until hydration is done so the
// first render matches the server's.
if (import.meta.client && !useNuxtApp().isHydrating) fetchMine()
else onMounted(fetchMine)

watch(() => props.albumId, fetchMine)
</script>
