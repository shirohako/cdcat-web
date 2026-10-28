<script setup lang="ts">
/**
 * 文章: an article as its list card draws it (inset cover, type, title, summary, author), beside what goes with it:
 * the original-or-repost declaration with the licence, the items it is linked to, its tag, and the states it moves
 * through.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const LINKS = [
  { icon: 'lucide:disc-3', name: '星屑のアトラス' },
  { icon: 'lucide:mic-2', name: 'ステラノート' },
  { icon: 'lucide:calendar', name: 'M3-2026秋' },
]
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-[13.5rem_minmax(0,1fr)]" aria-hidden="true">
    <div class="rounded-lg bg-card p-2 shadow-xs ring-1 ring-line">
      <div class="relative">
        <GuideFigureSampleCover class="h-24 w-full rounded-md" preserveAspectRatio="xMidYMid slice" />
        <span class="absolute left-1.5 top-1.5 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">{{ text.type }}</span>
      </div>
      <p class="mt-2 line-clamp-2 px-0.5 text-xs font-bold leading-[1.125rem] text-title">{{ text.title }}</p>
      <p class="mt-1 line-clamp-2 px-0.5 text-[11px] leading-4 text-meta">{{ text.summary }}</p>
      <p class="mt-2 flex items-center gap-1.5 px-0.5 text-[10px] text-meta">
        <GuideFigureForumAvatar :shift="0" class="size-4! [&_.iconify]:size-2.5!" />
        <span class="text-body">{{ text.author }}</span>
        <span>2026-10-27</span>
        <span class="ml-auto inline-flex items-center gap-0.5"><Icon name="lucide:heart" class="size-3" />24</span>
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-2.5">
      <div class="rounded-lg bg-card p-2.5 ring-1 ring-line">
        <p class="flex flex-wrap items-center gap-1.5 text-[11px]">
          <GuideMockChip :label="t('article_ui.declaration.original')" selected />
          <span class="inline-flex h-5 items-center gap-1 rounded-md border border-line px-1.5 font-mono text-[10px] font-semibold text-title">
            <Icon name="lucide:creative-commons" class="size-3" />CC BY-NC-SA 4.0
          </span>
          <span class="text-[10px] text-meta">{{ t('article_ui.licenses.cc_by_nc_sa.summary') }}</span>
        </p>
        <p class="mt-2.5 text-[11px] font-semibold text-meta">{{ text.links_title }}</p>
        <p class="mt-1 flex flex-wrap gap-1.5">
          <span v-for="link in LINKS" :key="link.name" class="inline-flex h-6 items-center gap-1 rounded-md bg-sunken px-1.5 text-[11px] text-title">
            <Icon :name="link.icon" class="size-3 text-meta" />{{ link.name }}
          </span>
          <span class="inline-flex h-6 items-center rounded-md bg-(--accent-soft) px-1.5 text-[11px] text-(--accent)">#{{ text.tag }}</span>
        </p>
      </div>

      <div class="rounded-lg bg-card p-2.5 ring-1 ring-line">
        <p class="text-[11px] font-semibold text-meta">{{ text.states_title }}</p>
        <div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <GuideMockChip :label="t('article_ui.statuses.draft')" />
          <Icon name="lucide:arrow-right" class="size-3 text-faint" />
          <GuideMockChip :label="t('article_ui.statuses.published')" tone="success" />
          <Icon name="lucide:arrow-left-right" class="size-3 text-faint" />
          <GuideMockChip :label="t('article_ui.statuses.hidden')" />
          <span class="ml-auto inline-flex items-center gap-1 text-[10px] text-meta">
            {{ t('discussions.post.moderator') }}<Icon name="lucide:arrow-right" class="size-3 text-faint" />
            <GuideMockChip :label="t('article_ui.statuses.locked')" tone="warning" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
