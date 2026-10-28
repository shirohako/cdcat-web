<script setup lang="ts">
/**
 * 碟片与曲目: the paste dialog with a tracklist pasted in, and the disc it turns into. Markers 1–5 on the track rows
 * match the track steps under the figure: number, title, length, instrumental, and the expand button; the third
 * track is open, showing its printed number, ISRC and a text-only original.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const PASTED = ['01. 星屑のアトラス 4:12', '02. 夜明けのプラネタリウム 3:58', '03. 銀河鉄道の切符 5:01', '04. 星屑のアトラス (Instrumental) 4:12', 'Disc 2', '01. 星屑のアトラス (Music Clip)']
const TRACKS = [
  { n: 1, title: '星屑のアトラス', time: '4:12' },
  { n: 2, title: '夜明けのプラネタリウム', time: '3:58' },
  { n: 3, title: '銀河鉄道の切符', time: '5:01', open: true },
  { n: 4, title: '星屑のアトラス (Instrumental)', time: '4:12', instrumental: true },
]
</script>

<template>
  <div class="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" aria-hidden="true">
    <div class="overflow-hidden rounded-lg bg-popover shadow-overlay ring-1 ring-line">
      <p class="flex items-center gap-2 border-b border-line px-3 py-2 text-[13px] font-semibold text-title">
        <Icon name="lucide:clipboard-paste" class="size-3.5 text-primary" />{{ t('editor.paste.title') }}
      </p>
      <div class="space-y-2 p-3">
        <p class="line-clamp-3 text-[10px] leading-3.5 text-meta">{{ t('editor.paste.hint') }}</p>
        <div class="rounded-md border border-field-line bg-field px-2 py-1.5 font-mono text-[10px] leading-4 text-title">
          <p v-for="line in PASTED" :key="line" class="truncate" :class="{ 'font-bold text-primary': line === 'Disc 2' }">{{ line }}</p>
        </div>
        <p class="space-y-1">
          <GuideMockCheck :label="t('editor.paste.mode_update')" checked class="flex!" />
          <GuideMockCheck :label="t('editor.paste.mode_append')" class="flex!" />
        </p>
        <p class="flex items-center justify-end gap-2">
          <span class="text-[11px] text-meta">{{ t('editor.paste.count', { count: 5 }) }}</span>
          <GuideMockButton :label="t('editor.paste.apply')" variant="primary" />
        </p>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg bg-card shadow-xs ring-1 ring-line">
      <div class="flex flex-wrap items-center gap-1.5 border-b border-line bg-sunken px-2.5 py-1.5">
        <Icon name="lucide:disc-3" class="size-3.5 shrink-0 text-meta" />
        <span class="text-xs font-bold text-body">{{ t('editor.album.disc_n', { n: 1 }) }}</span>
        <GuideMockField :value="t('catalog.disc_format.cd')" select class="w-20" />
        <GuideMockField :placeholder="t('editor.album.disc_title_placeholder')" class="min-w-24 flex-1" />
        <GuideMockButton label="TOC" class="h-6! px-1.5!" />
      </div>

      <div v-for="track in TRACKS" :key="track.n" class="border-b border-line last:border-b-0">
        <div class="flex items-center gap-1.5 px-2.5 py-1.5">
          <span class="relative">
            <GuideMockMarker v-if="track.n === 1" :n="1" class="absolute -left-2 -top-2 z-10" />
            <span class="grid h-7 w-9 place-items-center rounded-md border border-field-line bg-field font-mono text-xs text-title">{{ track.n }}</span>
          </span>
          <span class="relative min-w-0 flex-1">
            <GuideMockMarker v-if="track.n === 1" :n="2" class="absolute -left-2 -top-2 z-10" />
            <GuideMockField :value="track.title" />
          </span>
          <span class="relative hidden sm:block">
            <GuideMockMarker v-if="track.n === 1" :n="3" class="absolute -left-2 -top-2 z-10" />
            <GuideMockField :value="track.time" mono class="w-14" />
          </span>
          <span class="relative inline-flex shrink-0 items-center gap-1 px-0.5 text-[11px]" :class="track.instrumental ? 'text-primary' : 'text-meta'">
            <GuideMockMarker v-if="track.n === 4" :n="4" class="absolute -left-2.5 -top-2.5 z-10" />
            <GuideMockCheck :checked="track.instrumental" />
            <Icon name="lucide:music-2" class="size-3" />
          </span>
          <span v-if="track.open" class="hidden shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary sm:inline">{{ t('editor.originals.badge', { count: 1 }) }}</span>
          <span class="relative">
            <GuideMockMarker v-if="track.open" :n="5" class="absolute -left-2 -top-2 z-10" />
            <GuideMockButton icon="lucide:chevron-down" class="px-1.5!" :class="{ '[&_.iconify]:rotate-180': track.open }" />
          </span>
          <GuideMockButton icon="lucide:x" variant="danger" />
        </div>
        <div v-if="track.open" class="space-y-2.5 border-t border-dashed border-line bg-sunken px-3 py-2.5">
          <div class="flex flex-wrap gap-2">
            <GuideMockField :label="t('catalog.field.number_label')" placeholder="A1" mono class="w-16" />
            <GuideMockField label="ISRC" value="JPXX02600003" mono class="w-32" />
          </div>
          <div>
            <p class="mb-1 text-[11px] font-semibold text-body">{{ t('editor.originals.title') }}</p>
            <span class="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md bg-card px-2 text-xs text-title ring-1 ring-line">
              <Icon name="lucide:file-text" class="size-3.5 shrink-0 text-meta" />
              <span class="truncate">亡き王女の為のセプテット（東方紅魔郷）</span>
              <span class="shrink-0 rounded-full bg-sunken px-1.5 text-[10px] text-meta">{{ t('editor.originals.text_only') }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 border-t border-line px-2.5 py-1.5">
        <GuideMockButton :label="t('editor.album.add_track')" icon="lucide:plus" variant="add" class="h-6!" />
        <span class="ml-auto font-mono text-[11px] text-meta">17:23</span>
      </div>
    </div>
  </div>
</template>
