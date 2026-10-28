<script setup lang="ts">
/**
 * 检查并提交: the duplicate check's panel with one strong match, then the submit section filled in: markers 1–4 match
 * the steps under the figure (summary, sources, the change preview, the submit button with its notice).
 */
const props = defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const sources = computed(() => `${props.text.source ?? ''}\nhttps://stellanote.example/atlas`)
</script>

<template>
  <div class="space-y-3" aria-hidden="true">
    <div class="rounded-lg border border-warning/30 bg-warning/10 p-3">
      <p class="flex items-center gap-1.5 text-xs font-semibold text-warning"><Icon name="lucide:copy-check" class="size-3.5" />{{ t('duplicates.title') }}</p>
      <p class="mt-1 line-clamp-2 text-[11px] leading-4 text-body">{{ t('duplicates.strong_hint') }}</p>
      <p class="mt-2 flex items-center gap-2.5 rounded-md bg-card px-2 py-1.5 ring-1 ring-line">
        <GuideFigureSampleCover class="size-8 shrink-0 rounded-[3px]" />
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-1.5">
            <span class="truncate text-xs font-semibold text-title">星屑のアトラス</span>
            <span class="shrink-0 rounded-full bg-warning/15 px-1.5 text-[10px] font-semibold text-warning">{{ t('pending.badge') }}</span>
          </span>
          <span class="block truncate text-[10px] text-meta">{{ t('duplicates.reasons.catalog_number', { value: 'STNT-0012' }) }}</span>
        </span>
        <GuideMockCheck :label="t('duplicates.not_same')" />
      </p>
    </div>

    <GuideMockPanel :title="t('editor.section_submit')" icon="lucide:send">
      <div class="space-y-2.5">
        <GuideMockField :n="1" :label="t('editor.summary')" :value="text.summary" area />
        <GuideMockField :n="2" :label="t('editor.sources')" :value="sources" area class="[&_.line-clamp-2]:whitespace-pre-line" />
        <p class="flex items-center gap-1.5 text-[11px] font-medium text-body">
          <GuideMockMarker :n="3" />
          <Icon name="lucide:chevron-right" class="size-3 text-meta" />{{ t('editor.preview_changes', { count: 18 }) }}
        </p>
        <p class="flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
          <span class="relative">
            <GuideMockMarker :n="4" class="absolute -left-1.5 -top-1.5 z-10" />
            <GuideMockButton :label="t('editor.submit_review')" variant="primary" />
          </span>
          <GuideMockButton :label="t('editor.save_draft')" />
          <GuideMockButton :label="t('editor.discard')" variant="danger" class="px-2.5!" />
          <span class="min-w-48 flex-1 text-[10px] leading-3.5 text-meta">{{ t('editor.pending_notice') }}</span>
        </p>
      </div>
    </GuideMockPanel>
  </div>
</template>
