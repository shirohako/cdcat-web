<template>
  <div class="mt-1.5 flex items-start gap-2">
    <span v-if="!option.plain" class="shrink-0 rounded px-1.5 text-[11px] font-semibold leading-5" :class="option.recommended ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'">{{ t(`editor.credits.album_examples.${option.recommended ? 'recommended' : 'not_recommended'}`) }}</span>
    <div class="flex min-w-0 flex-wrap items-center gap-1.5 text-body">
      <span v-for="([field, value, key], at) in option.fill" :key="at" class="inline-flex items-center gap-1 rounded px-1.5" :class="key ? 'bg-blue-100 dark:bg-blue-400/20 text-title' : 'bg-black/[0.05] dark:bg-white/[0.08]'">
        <Star v-if="key" :size="11" fill="currentColor" class="shrink-0 text-blue-600 dark:text-blue-300" /><span class="text-meta">{{ field }}</span> {{ value }}
      </span>
      <ArrowRight :size="12" class="shrink-0 text-faint" />
      <span class="flex flex-wrap items-center gap-1.5">
        <template v-for="(pair, at) in option.shown" :key="at">
          <span v-if="pair.role" class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="getAlbumRolePalette(roleCategory(pair.role)).badge">{{ pair.label }}</span>
          <span class="inline-flex items-center rounded-md bg-black/[0.05] px-1.5 py-0.5 leading-4 text-title dark:bg-white/[0.08]">{{ pair.name }}</span>
        </template>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowRight, Star } from '@lucide/vue'
import { getAlbumRolePalette } from '~/utils/albumRolePalette'

export interface ExampleTag { role?: string, label?: string, name: string }
/** `fill`: field, value and, on the field that makes the difference, a third item. `plain` has no 推荐 / 不推荐 tag. */
export interface ExampleOptionData { recommended?: boolean, plain?: boolean, shown: ExampleTag[], fill: Array<[string, string, true?]> }
</script>

<script setup lang="ts">
/** One way of filling in a credit: its fields, then what the page shows, drawn as the album page draws it. */
defineProps<{ option: ExampleOptionData }>()

const { t } = useI18n()
const { roleCategory } = useCatalogSchema()
</script>
