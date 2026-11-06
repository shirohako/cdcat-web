<template>
  <section class="card">
    <!-- The card has no overflow-hidden: it would cut off the export menu. -->
    <UiSectionTitle :title="$t('album.section.editing')" :icon="PenLine" size="sm" class="px-5 pb-3 pt-4 [&_h2]:leading-5" />

    <div class="space-y-3 px-5 pb-5">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="flex min-w-0 items-center gap-2">
          <span class="shrink-0 rounded bg-sunken px-1.5 py-0.5 font-mono text-xs font-bold text-title ring-1 ring-inset ring-line">{{ $t('versions.short', { version: album.version }) }}</span>
          <span class="truncate text-body">{{ $t('album.editing.version') }}</span>
        </span>
        <UiTooltip v-if="album.edited_at" :text="exact(album.edited_at)">
          <span class="shrink-0 text-xs text-meta">{{ $t('album.editing.edited_at', { date: formatDate(album.edited_at) }) }}</span>
        </UiTooltip>
      </div>

      <!-- Small buttons at their own width, like the other side cards' actions. -->
      <!-- The row anchors the export menu rather than its button, which wraps to any place along it: the menu starts at
           the card's edge, so it stays on a phone's screen. -->
      <div class="relative flex flex-wrap items-center gap-2">
        <UiButton :to="editTo" variant="primary" size="xs" :icon="SquarePen">{{ $t('common.edit') }}</UiButton>
        <UiButton :to="`/albums/${album.id}/versions`" size="xs" :icon="History">{{ $t('versions.title') }}</UiButton>
        <!-- Not in the editor's preview, whose album has no page to name as the source yet. -->
        <UiMenu v-if="!preview" width="w-64" :label="$t('album.export.button')" class="static!">
          <template #trigger="{ toggle, attrs }">
            <UiButton size="xs" :icon="Download" v-bind="attrs" @click="toggle">{{ $t('album.export.button') }}</UiButton>
          </template>
          <UiMenuItem v-for="item in exports" :key="item.format" :icon="item.icon" :hint="$t(`album.export.${item.format}_hint`)" @click="exportAlbum(album, item.format)">
            {{ $t(`album.export.${item.format}`) }}
          </UiMenuItem>
        </UiMenu>
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
import type { Component } from 'vue'
import type { Album } from '~/types/album'
import type { AlbumExportFormat } from '~/utils/albumExport'
import { Braces, ChevronRight, Download, FileSpreadsheet, FileText, Fingerprint, History, PenLine, SquarePen } from '@lucide/vue'

/**
 * The side column's last card: the current version, when it was made, the ways to change the album, the export to a
 * file, and the CD's disc ids when someone has pasted a TOC (or a prompt to paste one).
 */
const props = defineProps<{ album: Album, preview?: boolean }>()

const { isAuthenticated } = useAuth()
const { formatDate } = useLocaleFormatting()
const { exact } = useRelativeTime()
const { exportAlbum } = useAlbumExport()

const exports: Array<{ format: AlbumExportFormat, icon: Component }> = [
  { format: 'csv', icon: FileSpreadsheet },
  { format: 'markdown', icon: FileText },
  { format: 'json', icon: Braces },
]

const idsOpen = ref(false)
const tocDiscs = computed(() => props.album.discs.filter(disc => disc.tocs.length))
const hasCd = computed(() => props.album.discs.some(disc => disc.format === 'cd' || disc.format === 'sacd'))

const editTo = computed(() => isAuthenticated.value
  ? `/contribute/album/${props.album.id}`
  : `/auth/login?redirect=/contribute/album/${props.album.id}`)
const tocTo = computed(() => {
  const path = `/contribute/album/${props.album.id}?section=tracks`
  return isAuthenticated.value ? path : `/auth/login?redirect=${encodeURIComponent(path)}`
})
</script>
