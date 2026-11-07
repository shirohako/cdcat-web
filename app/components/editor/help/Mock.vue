<template>
  <div aria-hidden="true" class="rounded-md bg-card p-2 text-[10.5px] leading-4 text-body ring-1 ring-line">
    <!-- A row of the album page's editions table -->
    <div v-if="mock.page === 'edition'" class="space-y-1">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0 space-y-1">
          <p><span class="font-semibold text-title" :class="on('name')">Limited Edition</span></p>
          <p class="flex flex-wrap items-center gap-1">
            <span class="rounded-sm bg-black/[0.05] px-1 dark:bg-white/[0.08]" :class="on('discs')">CD+BD</span>
            <span class="rounded-sm bg-black/[0.05] px-1 font-mono dark:bg-white/[0.08]" :class="on('catalog')">STLN-0012~3</span>
            <span class="rounded-sm bg-black/[0.05] px-1 dark:bg-white/[0.08]" :class="on('region')">Japan</span>
            <span class="rounded-sm bg-black/[0.05] px-1 dark:bg-white/[0.08]" :class="on('date')">2026-10-25</span>
            <span class="rounded-sm bg-black/[0.05] px-1 dark:bg-white/[0.08]" :class="on('discs')">Disc 1–2</span>
            <span class="rounded-sm bg-amber-100 px-1 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200" :class="on('limited')">First press</span>
            <span class="rounded-sm bg-violet-100 px-1 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200" :class="on('hires')">Hi-Res</span>
            <span class="rounded-sm bg-black/[0.05] px-1 text-meta dark:bg-white/[0.08]" :class="on('sold_out')">Out of print</span>
          </p>
        </div>
        <p class="shrink-0"><span class="rounded-sm bg-black/[0.05] px-1 dark:bg-white/[0.08]" :class="on('type')">Limited</span></p>
        <p class="shrink-0"><span class="rounded-sm bg-black/[0.05] px-1 dark:bg-white/[0.08]" :class="on('medium')">Physical</span></p>
        <p class="shrink-0 text-right"><span class="font-semibold text-title" :class="on('price')">JPY ¥3,300</span></p>
      </div>
      <p><span :class="on('note')">Comes with a Blu-ray</span></p>
    </div>

    <!-- A disc's heading and a track of the tracklist -->
    <div v-else class="space-y-1">
      <p class="flex items-center gap-1.5 border-b border-line pb-1">
        <span class="font-bold text-title">DISC 1</span>
        <span class="text-meta" :class="on('disc_title')">Original Tracks</span>
        <span class="rounded-sm bg-black/[0.05] px-1 dark:bg-white/[0.08]" :class="on('disc_format')">CD</span>
      </p>
      <p class="flex items-baseline gap-2">
        <span class="tabular-nums text-meta" :class="on('number')">01</span>
        <span class="min-w-0 flex-1 truncate">
          <span class="text-xs text-title" :class="on('title')">Atlas of Stardust</span>
          <span class="ml-1 rounded-sm bg-black/[0.05] px-1 dark:bg-white/[0.08]" :class="on('instrumental')">Instrumental</span>
        </span>
        <span class="tabular-nums text-meta" :class="on('duration')">4:12</span>
      </p>
      <p class="flex flex-wrap items-center gap-1 pl-5">
        <span class="rounded-sm bg-blue-100 px-1 font-semibold text-blue-700 dark:bg-blue-400/20 dark:text-blue-200" :class="on('role_label')">{{ mock.mark === 'role_label' ? 'Graphic Designer' : 'Composer' }}</span>
        <span class="rounded-sm bg-black/[0.05] px-1 text-title dark:bg-white/[0.08]" :class="on('credit')">Minato</span>
        <span class="grid place-items-center rounded-sm text-meta" :class="on('detail')"><Icon name="lucide:info" class="size-3" /></span>
        <span class="ml-1 text-meta" :class="on('original')">Original: Memory of Stars</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EditorHelpMock } from '~/editorHelp'

/** A small drawing of a part of the album page, fictional album and all, with the piece a field fills marked. In English for every language. */
const props = defineProps<{ mock: EditorHelpMock }>()

const on = (part: string) => props.mock.mark === part && 'rounded-sm bg-primary/20 text-primary ring-2 ring-primary'
</script>
