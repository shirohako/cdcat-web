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
      <NuxtLink v-if="trackId" :to="`/tracks/${trackId}`" class="btn btn-ghost btn-xs mt-0.5 shrink-0 gap-1 font-normal text-meta hover:text-primary" @click="open = false">
        {{ $t('lyrics_ui.open_track') }}<ArrowUpRight :size="12" />
      </NuxtLink>
    </template>
    <LyricsPanel v-if="trackId" :key="trackId" :track-id="trackId" />
  </EditorModal>
</template>

<script setup lang="ts">
import { ArrowUpRight, FileText } from '@lucide/vue'

/** The lyrics of one track over the album page; the panel is the same as on the track page. */
defineProps<{ trackId: number | null, title?: string }>()
const open = defineModel<boolean>({ required: true })
</script>
