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
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { History, PenLine, SquarePen } from '@lucide/vue'

/** The side column's last card: the current version, when it was made, and the ways to change the album. */
const props = defineProps<{
  albumId: number
  version: number
  editedAt: string | null
}>()

const { isAuthenticated } = useAuth()
const { formatDate } = useLocaleFormatting()
const { exact } = useRelativeTime()

const editTo = computed(() => isAuthenticated.value
  ? `/contribute/album/${props.albumId}`
  : `/auth/login?redirect=/contribute/album/${props.albumId}`)
</script>
