<template>
  <div class="overflow-hidden rounded-lg border" :class="errors.length ? 'border-danger/40' : 'border-line'">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 bg-sunken px-3 py-2 text-xs">
      <span class="font-semibold text-title">{{ label }}</span>
      <span class="text-body">{{ facts }}</span>
      <span class="text-meta">{{ sourceLabel }}</span>
      <span v-if="$slots.actions" class="ml-auto flex shrink-0 items-center gap-1"><slot name="actions" /></span>
    </div>
    <div class="space-y-2 px-3 py-2 text-xs">
      <p :class="matches ? 'text-success' : 'text-warning'">
        {{ matches ? $t('editor.toc.matches', { count: trackCount }) : $t('editor.toc.count_mismatch', { tracks: audio, count: trackCount }) }}
      </p>
      <slot />
      <p v-for="error in errors" :key="error.path" class="text-danger">
        <span v-if="where(error.path)" class="font-medium">{{ where(error.path) }}: </span>{{ error.message }}
      </p>
      <UiButton :icon="tableOpen ? ChevronUp : ChevronDown" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="tableOpen = !tableOpen">
        {{ tableOpen ? $t('editor.toc.hide_table') : $t('editor.toc.show_table') }}
      </UiButton>
      <UiCollapse :open="tableOpen" lazy>
        <CatalogTocTable :toc="toc" />
      </UiCollapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldError } from '~/composables/useAlbumEditor'
import type { DiscTocLike } from '~/utils/discToc'
import { ChevronDown, ChevronUp } from '@lucide/vue'
import { audioLength, audioRows, toSeconds } from '~/utils/discToc'

/** One TOC in the TOC dialog: its audio tracks and length, whether they match the disc, its errors and its table. */
const props = withDefaults(defineProps<{
  toc: DiscTocLike & { source: string }
  label: string
  /** Tracks on the disc in the editor. */
  trackCount: number
  errors?: FieldError[]
}>(), { errors: () => [] })

const { t, te } = useI18n()
const { formatDuration } = useCatalogDisplay()
const { fieldLabel } = useDocumentSchema('album')

const tableOpen = ref(false)
const audio = computed(() => audioRows(props.toc).length)
const matches = computed(() => audio.value === props.trackCount)
const facts = computed(() => [
  t('editor.toc.facts', { tracks: audio.value, length: formatDuration(toSeconds(audioLength(props.toc))) }),
  props.toc.data_track !== null ? t('editor.toc.with_data') : null,
].filter(Boolean).join(' · '))
const sourceLabel = computed(() => te(`catalog.toc.source.${props.toc.source}`) ? t(`catalog.toc.source.${props.toc.source}`) : props.toc.source)

/** A field's name for errors under a field, e.g. items.r1.disc_tocs.7.leadout_offset. */
const where = (path: string) => {
  const rest = path.split('.').slice(4)
  return rest.length ? fieldLabel(rest.at(-1)!) : ''
}
</script>
