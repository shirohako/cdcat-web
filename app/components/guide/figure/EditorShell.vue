<script setup lang="ts">
/**
 * 编辑器的布局: the album editor in miniature, with the real labels. The header with the draft status, the section list
 * (a warning dot where a required item is missing), the required checklist at 3/5, the suggestions, and the open
 * section sketched in grey. Markers 1–4 match the steps under the figure.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()
const { ago } = useRelativeTime()

const SECTIONS = [
  { key: 'editor.album.section.basic', icon: 'lucide:info' },
  { key: 'editor.album.section.tracks', icon: 'lucide:list-music', missing: true },
  { key: 'editor.album.section.credits', icon: 'lucide:contact' },
  { key: 'editor.album.section.editions', icon: 'lucide:package' },
  { key: 'editor.album.section.bonuses', icon: 'lucide:gift' },
  { key: 'editor.album.section.images', icon: 'lucide:images' },
  { key: 'editor.album.section.relations', icon: 'lucide:network' },
  { key: 'editor.mode_translate', icon: 'lucide:languages' },
  { key: 'editor.section_submit', icon: 'lucide:send' },
]
const REQUIRED = [
  { key: 'title', done: true },
  { key: 'type', done: true },
  { key: 'release_date', done: true },
  { key: 'cover', done: false },
  { key: 'tracks', done: false },
]
// Rendered once on the server and once in the browser: both say "just now".
const saved = computed(() => t('editor.state_saved', { at: ago(new Date().toISOString()) }))
</script>

<template>
  <div class="space-y-2.5" aria-hidden="true">
    <div class="rounded-lg bg-card px-3 py-2.5 shadow-xs ring-1 ring-line">
      <div class="flex items-end gap-2">
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-meta">{{ t('editor.album.new_title') }}</p>
          <p class="truncate text-[15px] font-bold text-title">星屑のアトラス</p>
        </div>
        <GuideMockButton :label="t('editor.my_revisions')" icon="lucide:clipboard-list" />
      </div>
      <p class="mt-2 flex items-center gap-1.5 border-t border-line pt-2 text-[11px] text-meta">
        <GuideMockMarker :n="4" />
        <span class="size-1.5 shrink-0 rounded-full bg-success" />
        <span class="shrink-0 text-body">{{ saved }}</span>
        <span class="text-faint">·</span>
        <span class="truncate">{{ t('editor.local_hint') }}</span>
      </p>
    </div>

    <div class="grid gap-2.5 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <div class="space-y-2.5">
        <div class="relative rounded-lg bg-card p-1 shadow-xs ring-1 ring-line">
          <GuideMockMarker :n="1" class="absolute -left-1.5 -top-1.5 z-10" />
          <ul class="grid grid-cols-3 gap-px sm:grid-cols-1">
            <li
              v-for="(section, index) in SECTIONS"
              :key="section.key"
              class="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px]"
              :class="index === 0 ? 'bg-primary/10 font-semibold text-primary' : 'text-body'"
            >
              <Icon :name="section.icon" class="size-3 shrink-0 text-meta" />
              <span class="min-w-0 flex-1 truncate">{{ t(section.key) }}</span>
              <span v-if="section.missing" class="size-1.5 shrink-0 rounded-full bg-warning" />
            </li>
          </ul>
        </div>

        <div class="relative rounded-lg bg-card p-2.5 shadow-xs ring-1 ring-line">
          <GuideMockMarker :n="2" class="absolute -left-1.5 -top-1.5 z-10" />
          <p class="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-meta">
            {{ t('editor.required') }}<span class="font-mono tracking-normal">3/5</span>
          </p>
          <ul class="space-y-0.5">
            <li v-for="item in REQUIRED" :key="item.key" class="flex items-center gap-1.5 text-[11px]" :class="item.done ? 'text-meta' : 'text-title'">
              <Icon :name="item.done ? 'lucide:circle-check' : 'lucide:circle'" class="size-3 shrink-0" :class="item.done ? 'text-success' : 'text-warning'" />
              <span class="min-w-0 flex-1 truncate">{{ t(`editor.required_item.${item.key}`) }}</span>
              <Icon v-if="!item.done" name="lucide:chevron-right" class="size-3 shrink-0 text-faint" />
            </li>
          </ul>
          <p class="relative mb-1 mt-2 border-t border-line pt-2 text-[10px] font-bold uppercase tracking-wider text-meta">
            <GuideMockMarker :n="3" class="absolute -left-4 top-1.5" />{{ t('editor.recommended') }}
          </p>
          <ul class="space-y-0.5">
            <li v-for="key in ['catalog_number', 'credits']" :key="key" class="flex items-center gap-1.5 text-[11px] text-body">
              <Icon name="lucide:circle-plus" class="size-3 shrink-0 text-meta" />
              <span class="min-w-0 flex-1 truncate">{{ t(`editor.suggested_item.${key}`) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- The open section, sketched: the cover slot and a few fields. -->
      <GuideMockPanel :title="t('editor.album.section.basic')" icon="lucide:info" class="hidden sm:block">
        <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
          <span class="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-line bg-sunken text-faint">
            <Icon name="lucide:image-plus" class="size-5" />
          </span>
          <div class="space-y-2.5">
            <GuideMockField :label="t('catalog.field.title')" value="星屑のアトラス" required />
            <div class="grid grid-cols-2 gap-2">
              <GuideMockField :label="t('catalog.field.release_date')" value="2026-10-25" required mono />
              <GuideMockField :label="t('catalog.field.type')" :value="t('albums.type.album')" required select />
            </div>
            <span class="block h-2 w-3/4 rounded-full bg-sunken" />
            <span class="block h-2 w-1/2 rounded-full bg-sunken" />
          </div>
        </div>
      </GuideMockPanel>
    </div>
  </div>
</template>
