<template>
  <EditorModal
    v-model="open"
    as="div"
    wide
    :title="title || $t('lyrics_ui.lyrics_and_translations')"
    :description="title ? $t('lyrics_ui.lyrics_and_translations') : undefined"
    :icon="FileText"
    tone="sky"
  >
    <template #actions>
      <UiButton v-if="trackId" :to="`/tracks/${trackId}`" size="xs" :icon-right="ArrowUpRight" class="mt-0.5 shrink-0" @click="open = false">
        {{ $t('lyrics_ui.open_track') }}
      </UiButton>
    </template>
    <LyricsPanel v-if="trackId" :key="trackId" :track-id="trackId" :prefer="prefer" />
  </EditorModal>
</template>

<script setup lang="ts">
import { ArrowUpRight, FileText } from '@lucide/vue'

/** The lyrics of one track over the album page; the panel is the same as on the track page. */
defineProps<{
  trackId: number | null
  title?: string
  /** Open on a translation (one in the UI language when there is) rather than the original */
  prefer?: 'original' | 'translation'
}>()
const open = defineModel<boolean>({ required: true })
</script>
