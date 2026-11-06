<template>
  <ul class="divide-y divide-line">
    <li class="pb-2">
      <p class="flex items-center gap-1.5 font-semibold"><MapPin :size="13" class="shrink-0 text-violet-600 dark:text-violet-300" />{{ t('editor.credits.byline_guide.where') }}</p>
      <p class="mt-1 flex flex-wrap gap-1.5 pl-[1.1875rem]">
        <span v-for="place in PLACES" :key="place" class="rounded bg-black/[0.05] px-1.5 text-body dark:bg-white/[0.08]">{{ t(`editor.credits.byline_guide.place_${place}`) }}</span>
      </p>
    </li>
    <li class="py-2">
      <p class="flex items-center gap-1.5 font-semibold"><ListOrdered :size="13" class="shrink-0 text-violet-600 dark:text-violet-300" />{{ t('editor.credits.byline_guide.order') }}</p>
      <div class="pl-[1.1875rem]">
        <ol class="mt-1 flex flex-wrap items-center gap-1.5">
          <template v-for="(step, index) in STEPS" :key="step">
            <ArrowRight v-if="index" :size="12" class="shrink-0 text-faint" />
            <li class="inline-flex items-center gap-1.5 rounded bg-black/[0.05] pl-0.5 pr-1.5 text-body dark:bg-white/[0.08]">
              <span class="grid size-4 place-items-center rounded-sm bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200 text-[10px] font-bold leading-none">{{ index + 1 }}</span>{{ t(`editor.credits.byline_guide.step_${step}`) }}
            </li>
          </template>
        </ol>
        <p class="mt-1 text-meta">{{ t('editor.credits.byline_guide.order_note') }}</p>
      </div>
    </li>
    <li class="py-2">
      <p class="flex items-center gap-1.5 font-semibold"><PenLine :size="13" class="shrink-0 text-violet-600 dark:text-violet-300" />{{ t('editor.credits.byline_guide.advice') }}</p>
      <!-- Who goes where, by the kind of album. -->
      <div class="pl-[1.1875rem]">
        <div v-for="kind in KINDS" :key="kind" class="mt-1.5">
          <span class="inline-block rounded bg-violet-100 px-1.5 text-[11px] font-semibold leading-5 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200">{{ t(`editor.credits.byline_guide.${kind}`) }}</span>
          <p class="mt-0.5 text-body">{{ t(`editor.credits.byline_guide.${kind}_text`) }}</p>
        </div>
      </div>
    </li>
    <li class="py-2">
      <p class="flex items-center gap-1.5 font-semibold"><Copy :size="13" class="shrink-0 text-violet-600 dark:text-violet-300" />{{ t('editor.credits.byline_guide.repeat') }}</p>
      <div class="pl-[1.1875rem]">
        <p class="mt-0.5 text-body">{{ t('editor.credits.byline_guide.repeat_text') }}</p>
      </div>
    </li>
    <li class="pt-2">
      <p class="flex items-center gap-1.5 font-semibold"><UsersRound :size="13" class="shrink-0 text-violet-600 dark:text-violet-300" />{{ t('editor.credits.byline_guide.various') }}</p>
      <div class="pl-[1.1875rem]">
        <p class="mt-0.5 text-body">{{ t('editor.credits.byline_guide.various_text') }}</p>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ArrowRight, Copy, ListOrdered, MapPin, PenLine, UsersRound } from '@lucide/vue'

/** Who goes under 发行 and 艺术家, where the names under an album's title show, and how they are chosen (App\Support\AlbumByline). In the violet of the 专辑署名 block. */
const PLACES = ['album', 'lists', 'artist', 'search', 'track', 'share']
const STEPS = ['publisher', 'artist', 'none']
const KINDS = ['commercial', 'doujin']

const { t } = useI18n()
</script>
