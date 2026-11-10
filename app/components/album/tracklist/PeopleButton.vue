<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'
import { Users } from '@lucide/vue'

/**
 * How many people are credited on the track, as an outlined chip. Resting the pointer on it (a tap on touch screens,
 * a press or the keyboard too) opens the tracklist's credits card under it (`data-people-card`, useHoverCard); a tap,
 * press or key on it again closes the card. Always shown; with no one credited it reads a faded 0 and opens nothing.
 */
const props = defineProps<{ row: TracklistRow }>()

const { t } = useI18n()
const { openPeople } = useTracklist()
const label = computed(() => (props.row.people ? t('album.tracklist.people_button', { count: props.row.people }) : t('album.tracklist.people_none')))
</script>

<template>
  <button
    type="button"
    class="inline-flex h-5 shrink-0 items-center gap-1 rounded-[0.3125rem] px-1.5 text-11 font-semibold leading-none tabular-nums text-meta shadow-[inset_0_0_0_1px_var(--line)] transition-colors duration-150 enabled:hover:bg-black/[0.04] enabled:hover:text-title disabled:opacity-45 dark:enabled:hover:bg-white/[0.07]"
    :disabled="!row.people"
    :data-people-card="row.people ? row.id : undefined"
    :aria-label="label"
    @click="openPeople($event.currentTarget as HTMLElement)"
  >
    <Users :size="12" />{{ row.people }}
  </button>
</template>
