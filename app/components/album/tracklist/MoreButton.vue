<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'
import { Ellipsis } from '@lucide/vue'

/**
 * The row's "…": opens the tracklist's one more menu under it. With a mouse it shows while the row is hovered, focused
 * or its menu is open; on touch screens, and with `always` (the table's column), it always shows.
 */
const props = defineProps<{ row: TracklistRow, always?: boolean }>()

const { t } = useI18n()
const { openMore, moreFor } = useTracklist()
const open = computed(() => moreFor.value === props.row.id)
</script>

<template>
  <button
    type="button"
    class="inline-flex size-5 shrink-0 items-center justify-center rounded-[0.3125rem] text-meta transition-[color,background-color,opacity] duration-150 hover:bg-black/[0.06] hover:text-title dark:hover:bg-white/[0.1]"
    :class="open ? 'bg-black/[0.06] text-title dark:bg-white/[0.1]' : !always && 'pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-visible:opacity-100'"
    aria-haspopup="menu"
    :aria-expanded="open"
    :aria-label="t('album.tracklist.more')"
    @click="openMore(row, $event.currentTarget as HTMLElement)"
  >
    <Ellipsis :size="14" />
  </button>
</template>
