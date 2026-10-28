<script setup lang="ts">
/**
 * 所有资料共用的规则: the made-up album's names (the original as the main name, then an official English title, a
 * translation, a romanization, an alias and an abbreviation, each with its kind and language) beside its version
 * history, a timeline ending in a restore.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()
const { localeName } = useCatalogDisplay()

const NAMES = [
  { kind: 'official', locale: 'en', title: 'Atlas of Stardust' },
  { kind: 'translation', locale: 'zh-Hans', title: '星尘地图集' },
  { kind: 'transliteration', locale: 'ja-Latn', title: 'Hoshikuzu no Atlas' },
  { kind: 'alias', locale: '', title: '星屑アトラス' },
  { kind: 'abbreviation', locale: '', title: 'ホシアト' },
]
/** Newest first, as the version history lists them. */
const VERSIONS = [
  { n: 4, cause: 'restore', who: 'moderator', note: 'restore' },
  { n: 3, cause: 'edit', who: 'carol', note: 'edit_title' },
  { n: 2, cause: 'edit', who: 'bob', note: 'edit_credits' },
  { n: 1, cause: 'create', who: 'alice', note: '' },
]
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2" aria-hidden="true">
    <div class="rounded-lg bg-card p-3 ring-1 ring-line">
      <p class="flex items-center gap-1.5 text-xs font-semibold text-title"><Icon name="lucide:languages" class="size-3.5 text-meta" />{{ text.names_title }}</p>
      <div class="mt-2.5 rounded-md bg-(--accent-soft) px-2.5 py-2">
        <p class="text-[10px] font-semibold text-(--accent)">{{ text.primary }}</p>
        <p class="text-[13px] font-bold text-title">星屑のアトラス</p>
      </div>
      <ul class="mt-1.5 divide-y divide-line">
        <li v-for="name in NAMES" :key="name.kind" class="flex items-center gap-2 py-1.5">
          <span class="min-w-0 flex-1 truncate text-[11px] text-title">{{ name.title }}</span>
          <span v-if="name.locale" class="shrink-0 text-[10px] text-meta">{{ localeName(name.locale) }}</span>
          <!-- Official names by the name the "add a name" dialog gives them. -->
          <GuideMockChip :label="name.kind === 'official' ? t('editor.names.official') : t(`catalog.title_kind.${name.kind}`)" :tone="name.kind === 'official' ? 'soft' : 'plain'" />
        </li>
      </ul>
    </div>

    <div class="rounded-lg bg-card p-3 ring-1 ring-line">
      <p class="flex items-center gap-1.5 text-xs font-semibold text-title"><Icon name="lucide:history" class="size-3.5 text-meta" />{{ text.history_title }}</p>
      <ol class="relative mt-2.5 space-y-2.5 border-l border-line pl-4">
        <li v-for="version in VERSIONS" :key="version.n" class="relative">
          <span
            class="absolute -left-[1.3rem] top-1 size-2.5 rounded-full ring-2 ring-card"
            :class="version.cause === 'restore' ? 'bg-(--accent)' : version.n === 1 ? 'bg-success' : 'bg-faint'"
          />
          <p class="flex items-center gap-1.5 text-[11px]">
            <span class="font-mono font-semibold text-title">v{{ version.n }}</span>
            <GuideMockChip :label="t(`catalog.version_cause.${version.cause}`)" :tone="version.cause === 'restore' ? 'soft' : 'plain'" />
            <span class="ml-auto text-[10px] text-meta">{{ version.who === 'moderator' ? t('discussions.post.moderator') : version.who }}</span>
          </p>
          <p v-if="version.note" class="mt-0.5 truncate text-[11px] text-body">{{ text[version.note] }}</p>
        </li>
      </ol>
    </div>
  </div>
</template>
