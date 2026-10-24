<template>
  <CatalogSection v-if="tracks.length" :title="$t('tracks.album_tracklist')" :icon="ListMusic">
    <template #actions>{{ $t('content_display.track_count', { count: tracks.length }) }}</template>
    <div ref="list" class="relative max-h-[30rem] overflow-y-auto py-1.5">
      <template v-for="disc in discs" :key="disc.number">
        <p v-if="discs.length > 1" class="px-4 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-meta">Disc {{ disc.number }}</p>
        <NuxtLink
          v-for="item in disc.tracks"
          :key="item.id"
          :to="`/tracks/${item.id}`"
          :aria-current="item.id === currentId ? 'page' : undefined"
          class="flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors duration-150 ease-out"
          :class="item.id === currentId ? 'bg-primary/10 font-medium text-primary' : 'text-body hover:bg-card-hover active:bg-card-active'"
        >
          <span class="w-6 shrink-0 text-right font-mono text-xs" :class="item.id === currentId ? 'text-primary/70' : 'text-meta'">{{ item.number_label || item.track_number }}</span>
          <span class="min-w-0 flex-1 truncate">{{ localName(item.title, item.titles) }}</span>
          <FileText v-if="item.has_lyrics" :size="11" class="shrink-0 text-primary" />
          <span v-if="item.duration" class="shrink-0 font-mono text-[11px] text-meta">{{ formatDuration(item.duration) }}</span>
        </NuxtLink>
      </template>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { TrackDetail } from '~/types/album'
import { FileText, ListMusic } from '@lucide/vue'

/** Every track of the album, by disc, with the shown one marked; a long list starts scrolled to it. */
const props = defineProps<{ tracks: NonNullable<TrackDetail['album_tracks']>, currentId: number }>()

const { localName, formatDuration } = useCatalogDisplay()

const discs = computed(() => {
  const groups: Array<{ number: number, tracks: typeof props.tracks }> = []
  for (const track of props.tracks) {
    const last = groups.at(-1)
    if (last?.number === track.disc_number) last.tracks.push(track)
    else groups.push({ number: track.disc_number, tracks: [track] })
  }
  return groups
})

const list = useTemplateRef('list')
const reveal = () => {
  const box = list.value
  const item = box?.querySelector<HTMLElement>('[aria-current="page"]')
  if (box && item && box.scrollHeight > box.clientHeight) box.scrollTop = item.offsetTop - box.clientHeight / 2 + item.offsetHeight / 2
}
onMounted(reveal)
watch(() => props.currentId, () => nextTick(reveal))
</script>
