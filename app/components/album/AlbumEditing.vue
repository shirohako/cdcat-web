<template>
  <section class="card overflow-hidden">
    <UiSectionTitle :title="$t('album.section.editing')" :icon="PenLine" size="sm" class="px-5 pb-3 pt-4 [&_h2]:leading-5" />

    <div class="space-y-3 px-5 pb-5">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="flex min-w-0 items-center gap-2">
          <span class="shrink-0 rounded bg-sunken px-1.5 py-0.5 font-mono text-xs font-bold text-title ring-1 ring-inset ring-line">{{ $t('versions.short', { version }) }}</span>
          <span class="truncate text-body">{{ $t('album.editing.version') }}</span>
        </span>
        <UiTooltip v-if="editedAt" :text="exact(editedAt)">
          <span class="shrink-0 text-xs text-meta">{{ $t('album.editing.edited_at', { date: formatDate(editedAt) }) }}</span>
        </UiTooltip>
      </div>

      <!-- Small buttons at their own width, like the other side cards' actions. -->
      <div class="flex flex-wrap items-center gap-2">
        <UiButton :to="editTo" variant="primary" size="xs" :icon="SquarePen">{{ $t('common.edit') }}</UiButton>
        <UiButton :to="`/albums/${albumId}/versions`" size="xs" :icon="History">{{ $t('versions.title') }}</UiButton>
        <UiButton v-if="tocDiscs.length" size="xs" :icon="Fingerprint" @click="idsOpen = true">{{ $t('album.toc.button') }}</UiButton>
      </div>

      <!-- A CD nobody has read a TOC from yet: a quiet way into the editor's tracklist, where TOCs are pasted. -->
      <NuxtLink v-if="!tocDiscs.length && hasCd" :to="tocTo" class="group inline-flex items-center gap-0.5 text-xs text-meta transition-colors hover:text-primary">
        {{ $t('album.toc.missing') }}
        <ChevronRight class="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </NuxtLink>
    </div>

    <AlbumDiscIds v-if="tocDiscs.length" v-model="idsOpen" :discs="tocDiscs" />
  </section>
</template>

<script setup lang="ts">
import type { AlbumDisc } from '~/types/album'
import { ChevronRight, Fingerprint, History, PenLine, SquarePen } from '@lucide/vue'

/**
 * The side column's last card: the current version, when it was made, the ways to change the album, and the CD's
 * disc ids when someone has pasted a TOC (or a prompt to paste one).
 */
const props = defineProps<{
  albumId: number
  version: number
  editedAt: string | null
  discs: AlbumDisc[]
}>()

const { isAuthenticated } = useAuth()
const { formatDate } = useLocaleFormatting()
const { exact } = useRelativeTime()

const idsOpen = ref(false)
const tocDiscs = computed(() => props.discs.filter(disc => disc.tocs.length))
const hasCd = computed(() => props.discs.some(disc => disc.format === 'cd' || disc.format === 'sacd'))

const editTo = computed(() => isAuthenticated.value
  ? `/contribute/album/${props.albumId}`
  : `/auth/login?redirect=/contribute/album/${props.albumId}`)
const tocTo = computed(() => {
  const path = `/contribute/album/${props.albumId}?section=tracks`
  return isAuthenticated.value ? path : `/auth/login?redirect=${encodeURIComponent(path)}`
})
</script>
