<template>
  <div v-if="parts.length" class="space-y-1 rounded-lg border px-3 py-2 text-xs leading-5" :class="unaligned.length ? 'border-warning/30 bg-warning/10' : 'border-line bg-sunken'">
    <p class="text-body">
      <span class="font-semibold text-title">{{ $t('editor.paste.plan_lead') }}</span>{{ parts.join(' · ') }}
    </p>
    <p v-if="inserted.length" class="text-meta">{{ $t('editor.paste.plan_inserted', { tracks: inserted.join(', ') }) }}</p>
    <p v-if="unaligned.length" class="flex items-start gap-1.5 text-body">
      <TriangleAlert :size="13" class="mt-1 shrink-0 text-warning" />
      <span><span class="font-semibold text-title">{{ $t('editor.paste.unaligned_lead') }}</span>{{ $t('editor.paste.unaligned', { discs: unaligned.join(', ') }) }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { TracklistImportDisc } from '~/utils/albumDocument'
import { TriangleAlert } from '@lucide/vue'

/**
 * What applying a pasted tracklist or CUE sheet in `update` mode will do (planTracklistImport): tracks updated,
 * inserted where they belong and kept, the inserted ones that land between existing tracks, and discs whose rows could
 * only line up by number (no title or duration in common, and a different count), where a missing track would shift.
 */
const props = defineProps<{ plan: TracklistImportDisc[] }>()
const { t } = useI18n()

const count = (kind: 'update' | 'insert' | 'keep') => props.plan.reduce((sum, disc) => sum + disc.steps.filter(step => step.kind === kind).length, 0)
const parts = computed(() => [
  count('update') ? t('editor.paste.plan_update', { count: count('update') }) : null,
  count('insert') ? t('editor.paste.plan_insert', { count: count('insert') }) : null,
  count('keep') ? t('editor.paste.plan_keep', { count: count('keep') }) : null,
].filter((part): part is string => part !== null))

const several = computed(() => props.plan.length > 1)
const place = (disc: TracklistImportDisc, number: number) => several.value ? t('editor.album.disc_track', { disc: disc.position, number }) : String(number)

/** Inserted tracks with an existing one after them: the ones that change where the rest sit. */
const inserted = computed(() => props.plan.flatMap(disc => disc.steps.flatMap((step, index) =>
  step.kind === 'insert' && disc.steps.slice(index + 1).some(later => later.kind !== 'insert')
    ? [`${place(disc, step.number)} ${step.parsed?.title ?? ''}`.trim()]
    : [])))

const unaligned = computed(() => props.plan
  .filter(disc => disc.existing > 0 && disc.anchors === 0 && disc.steps.filter(step => step.parsed).length !== disc.existing)
  .map(disc => t('editor.album.disc_n', { n: disc.position })))
</script>
