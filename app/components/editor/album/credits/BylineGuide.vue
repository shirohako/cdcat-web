<template>
  <div>
    <!-- Who goes where, by the kind of album. -->
    <div class="grid gap-1.5 sm:grid-cols-2">
      <div v-for="kind in KINDS" :key="kind.key" class="rounded-md bg-black/[0.05] px-2 py-1.5 dark:bg-white/[0.08]">
        <span class="inline-block rounded px-1.5 text-[11px] font-semibold leading-5" :class="kind.tone">{{ t(`editor.credits.byline_guide.${kind.key}`) }}</span>
        <p class="mt-1 text-body">{{ t(`editor.credits.byline_guide.${kind.key}_text`) }}</p>
      </div>
    </div>
    <ul class="mt-2 divide-y divide-line border-t border-line">
    <li class="py-2">
      <p class="flex items-center gap-1.5 font-semibold"><MapPin :size="13" class="shrink-0 text-primary" />{{ t('editor.credits.byline_guide.where') }}</p>
      <p class="mt-1 flex flex-wrap gap-1.5 pl-[1.1875rem]">
        <span v-for="place in PLACES" :key="place" class="rounded bg-black/[0.05] px-1.5 text-body dark:bg-white/[0.08]">{{ t(`editor.credits.byline_guide.place_${place}`) }}</span>
      </p>
    </li>
    <li class="py-2">
      <p class="flex items-center gap-1.5 font-semibold"><ListOrdered :size="13" class="shrink-0 text-primary" />{{ t('editor.credits.byline_guide.order') }}</p>
      <div class="pl-[1.1875rem]">
        <ol class="mt-1 flex flex-wrap items-center gap-1.5">
          <template v-for="(step, index) in STEPS" :key="step">
            <ArrowRight v-if="index" :size="12" class="shrink-0 text-faint" />
            <li class="inline-flex items-center gap-1.5 rounded bg-black/[0.05] pl-0.5 pr-1.5 text-body dark:bg-white/[0.08]">
              <span class="grid size-4 place-items-center rounded-sm bg-primary/20 text-[10px] font-bold leading-none text-primary">{{ index + 1 }}</span>{{ t(`editor.credits.byline_guide.step_${step}`) }}
            </li>
          </template>
        </ol>
        <p class="mt-1 text-meta">{{ t('editor.credits.byline_guide.order_note') }}</p>
      </div>
    </li>
    <li class="py-2">
      <p class="flex items-center gap-1.5 font-semibold"><Copy :size="13" class="shrink-0 text-primary" />{{ t('editor.credits.byline_guide.repeat') }}</p>
      <div class="pl-[1.1875rem]">
        <p class="mt-0.5 text-body">{{ t('editor.credits.byline_guide.repeat_text') }}</p>
      </div>
    </li>
    <li class="pt-2">
      <p class="flex items-center gap-1.5 font-semibold"><UsersRound :size="13" class="shrink-0 text-primary" />{{ t('editor.credits.byline_guide.various') }}</p>
      <div class="pl-[1.1875rem]">
        <p class="mt-0.5 text-body">{{ t('editor.credits.byline_guide.various_text') }}</p>
      </div>
    </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Copy, ListOrdered, MapPin, UsersRound } from '@lucide/vue'

/** Who goes under 发行 and 艺术家, where the names under an album's title show, and how they are chosen (App\Support\AlbumByline). */
const PLACES = ['album', 'lists', 'artist', 'search', 'track', 'share']
const STEPS = ['publisher', 'artist', 'none']
const KINDS = [
  { key: 'commercial', tone: 'bg-primary/20 text-primary' },
  { key: 'doujin', tone: 'bg-info/20 text-info' },
]

const { t } = useI18n()
</script>
