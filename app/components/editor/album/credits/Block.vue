<template>
  <section class="rounded-lg border" :class="TONES[kind].edge">
    <header class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-t-[0.4375rem] border-b px-3 py-1.5" :class="[TONES[kind].edge, TONES[kind].head]">
      <div class="flex min-w-0 items-center gap-2" :class="TONES[kind].title">
        <component :is="TONES[kind].icon" :size="18" class="shrink-0" />
        <div class="min-w-0">
          <h3 class="text-sm font-semibold leading-5">{{ title }}</h3>
          <p class="text-11 leading-4 opacity-75">{{ description }}</p>
        </div>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <div class="p-3"><slot /></div>
  </section>
</template>

<script setup lang="ts">
import { Disc3, ListMusic, Signature } from '@lucide/vue'

/**
 * One of the three parts of 参与创作的人, each in its own colour and with its own icon, a line under the title saying
 * what goes in it. The colours don't follow the site's theme colour, which can be near-black.
 */
defineProps<{ kind: 'byline' | 'album' | 'tracks', title: string, description: string }>()

const TONES = {
  byline: { icon: Signature, edge: 'border-violet-300 dark:border-violet-400/50', head: 'bg-violet-100 dark:bg-violet-500/25', title: 'text-violet-900 dark:text-violet-100' },
  album: { icon: Disc3, edge: 'border-blue-300 dark:border-blue-400/50', head: 'bg-blue-100 dark:bg-blue-500/25', title: 'text-blue-900 dark:text-blue-100' },
  tracks: { icon: ListMusic, edge: 'border-rose-200 dark:border-rose-300/25', head: 'bg-rose-100/60 dark:bg-rose-400/12', title: 'text-rose-700 dark:text-rose-200' },
}
</script>
