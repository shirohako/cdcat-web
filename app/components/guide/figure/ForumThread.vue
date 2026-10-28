<script setup lang="ts">
/**
 * 讨论: a topic as its page draws it. The category and title, the first floor (the opening post) with an album card
 * inserted by [[album:…]] and reactions under it, then a reply floor with two replies nested under it.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()
</script>

<template>
  <div class="rounded-lg bg-card ring-1 ring-line" aria-hidden="true">
    <div class="border-b border-line px-3 py-2.5">
      <p class="flex items-center gap-1.5 text-[11px] text-meta">
        <Icon name="lucide:message-circle" class="size-3" />{{ text.category }}
        <span class="ml-1 rounded-sm bg-(--accent-soft) px-1.5 py-px text-(--accent)">#{{ text.tag }}</span>
      </p>
      <p class="mt-1 text-[13px] font-bold leading-5 text-title">{{ text.title }}</p>
    </div>

    <div class="flex gap-2.5 border-b border-line px-3 py-2.5">
      <GuideFigureForumAvatar :shift="0" />
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-1.5 text-[11px]">
          <span class="font-semibold text-title">alice</span>
          <span class="rounded-sm bg-primary/12 px-1 text-[10px] font-semibold text-primary">{{ t('discussions.post.op') }}</span>
          <span class="ml-auto font-mono text-faint">#1</span>
        </p>
        <p class="mt-1 text-[11px] leading-[1.125rem] text-body">{{ text.op_text }}</p>
        <!-- What [[album:…]] on a line of its own becomes. -->
        <div class="mt-1.5 flex max-w-64 items-center gap-2 rounded-md bg-sunken p-1.5 ring-1 ring-line">
          <GuideFigureSampleCover class="size-8 shrink-0 rounded-[3px]" />
          <span class="min-w-0">
            <span class="block truncate text-[11px] font-semibold text-title">星屑のアトラス</span>
            <span class="block truncate text-[10px] text-meta">ステラノート · 2026</span>
          </span>
          <Icon name="lucide:disc-3" class="ml-auto size-3.5 shrink-0 text-faint" />
        </div>
        <p class="mt-1.5 flex gap-1.5">
          <span class="inline-flex h-5 items-center gap-1 rounded-full bg-primary/10 px-2 text-[10px] font-semibold text-primary ring-1 ring-primary/30">👍 12</span>
          <span class="inline-flex h-5 items-center gap-1 rounded-full bg-sunken px-2 text-[10px] font-semibold text-body">🎉 3</span>
          <span class="inline-flex h-5 items-center rounded-full bg-sunken px-1.5 text-meta"><Icon name="lucide:smile-plus" class="size-3" /></span>
        </p>
      </div>
    </div>

    <div class="flex gap-2.5 px-3 py-2.5">
      <GuideFigureForumAvatar :shift="120" />
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-1.5 text-[11px]">
          <span class="font-semibold text-title">bob</span>
          <span class="ml-auto font-mono text-faint">#2</span>
        </p>
        <p class="mt-1 text-[11px] leading-[1.125rem] text-body">{{ text.floor_text }}</p>
        <ul class="mt-2 space-y-1.5 rounded-md bg-sunken px-2.5 py-2">
          <li class="text-[11px] leading-4 text-body">
            <span class="font-semibold text-title">carol</span>：{{ text.reply_text }}
          </li>
          <li class="text-[11px] leading-4 text-body">
            <span class="font-semibold text-title">alice</span>
            <span class="text-meta"> {{ t('discussions.post.replied_to') }} </span>
            <span class="text-primary">@carol</span>：{{ text.reply_to_text }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
