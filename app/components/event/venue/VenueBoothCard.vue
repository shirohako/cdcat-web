<template>
  <Teleport to="body">
    <div
      ref="card"
      class="fixed left-0 top-0 z-50 w-72 rounded-2xl bg-popover p-3 shadow-overlay ring-1 ring-line"
      :style="{ transform: `translate(${position.x}px, ${position.y}px)`, visibility: placed ? 'visible' : 'hidden' }"
      role="tooltip"
      @pointerenter="$emit('enter')"
      @pointerleave="$emit('leave')"
    >
      <template v-if="circle">
        <div class="flex gap-3">
          <div class="size-20 shrink-0 overflow-hidden rounded-xl bg-sunken ring-1 ring-line">
            <img v-if="circle.image_url" :src="circle.image_url" :alt="circle.name" class="h-full w-full object-cover">
            <div v-else class="flex h-full w-full items-center justify-center text-faint"><Users :size="28" /></div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold tracking-wide text-meta">{{ spaceLabel }}</p>
            <p class="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-title">{{ circle.name }}</p>
            <p v-if="circle.name_kana && circle.name_kana !== circle.name" class="truncate text-xs text-meta">{{ circle.name_kana }}</p>
            <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span v-if="circle.genre" class="inline-flex items-center gap-1 rounded-full bg-btn px-2 py-0.5 text-[11px] font-medium text-btn-content">
                <span class="size-2 rounded-full" :style="{ background: familyColor }" />{{ genreShortLabel(circle.genre, genres) }}
              </span>
              <!-- The checklist's gold star -->
              <span v-if="checked" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                <Star :size="11" fill="currentColor" />{{ t('event_page.checklist.short') }}
              </span>
            </div>
          </div>
        </div>
        <div class="mt-3 flex items-center gap-2 border-t border-line pt-2.5">
          <a
            v-if="circle.twitter_handle"
            :href="`https://x.com/${circle.twitter_handle}`"
            target="_blank"
            rel="noopener"
            class="inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
          >
            <Icon name="simple-icons:x" class="size-3.5 shrink-0" />
            <span class="truncate">@{{ circle.twitter_handle }}</span>
          </a>
          <NuxtLink
            v-if="circle.artist"
            :to="`/artists/${circle.artist.id}`"
            class="inline-flex min-w-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
          >
            <UserRound :size="13" class="shrink-0 opacity-60" />
            <span class="truncate">{{ t('event_page.circle.artist_page') }}</span>
          </NuxtLink>
          <button type="button" class="ml-auto shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-on-primary transition-colors duration-150 ease-out hover:bg-primary-strong" @click="$emit('open')">
            {{ t('event_page.circle.details') }}
          </button>
        </div>
      </template>
      <p v-else class="text-sm text-meta">
        <span class="font-semibold text-body">{{ spaceLabel }}</span> · {{ t('event_page.map.empty_space') }}
      </p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { VenueMapData } from '~/types/event'
import type { VenuePiece } from '~/utils/eventVenue'
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { Star, UserRound, Users } from '@lucide/vue'

const props = defineProps<{
  piece: VenuePiece
  anchor: Element
  spaceLabel: string
  genres: VenueMapData['genres']
  checked: boolean
}>()
defineEmits<{ open: [], enter: [], leave: [] }>()
const { t } = useI18n()

const card = ref<HTMLElement | null>(null)
const position = reactive({ x: 0, y: 0 })
const placed = ref(false)
const circle = computed(() => props.piece.circle)
const familyColor = computed(() => {
  const family = genreFamily(circle.value?.genre, props.genres)
  return GENRE_FAMILIES.find(f => f.key === family)?.color ?? 'var(--meta)'
})

let stop: (() => void) | null = null
const track = () => {
  stop?.()
  if (!card.value) return
  const floating = card.value
  stop = autoUpdate(props.anchor, floating, async () => {
    const result = await computePosition(props.anchor, floating, {
      strategy: 'fixed',
      placement: 'top',
      middleware: [offset(10), flip({ padding: 12 }), shift({ padding: 12 })],
    })
    position.x = Math.round(result.x)
    position.y = Math.round(result.y)
    placed.value = true
  })
}
onMounted(track)
watch(() => props.anchor, () => nextTick(track))
onBeforeUnmount(() => stop?.())
</script>
