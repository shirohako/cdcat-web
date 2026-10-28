<script setup lang="ts">
/**
 * 更正错误: the conflict panel the editor shows when someone else changed the same field first: the field's path, its
 * kind, your value and the current one side by side (yours picked), and the button that applies the choices.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()
</script>

<template>
  <div class="mx-auto max-w-xl rounded-lg border border-warning/30 bg-warning/10 p-3" aria-hidden="true">
    <p class="flex items-center gap-1.5 text-xs font-semibold text-warning"><Icon name="lucide:git-merge" class="size-3.5" />{{ t('editor.conflicts_title') }}</p>
    <p class="mt-1 text-[11px] leading-4 text-body">{{ t('editor.conflicts_hint') }}</p>
    <div class="mt-2.5 rounded-md bg-card p-2.5 ring-1 ring-line">
      <p class="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span class="rounded-sm bg-warning/15 px-1.5 font-semibold text-warning">{{ t('editor.conflict_kind.field') }}</span>
        <span class="text-meta">{{ t('catalog.collection.tracks') }} · 1-03 · {{ t('catalog.field.title') }}</span>
      </p>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <span class="rounded-md border border-primary/45 bg-primary/8 px-2 py-1.5">
          <span class="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
            <span class="grid size-3 place-items-center rounded-full border-[3.5px] border-primary" />{{ t('editor.mine') }}
          </span>
          <span class="mt-0.5 block truncate text-xs text-title">銀河鉄道の切符 -Album Mix-</span>
        </span>
        <span class="rounded-md border border-line px-2 py-1.5">
          <span class="flex items-center gap-1.5 text-[10px] font-semibold text-meta">
            <span class="size-3 rounded-full border border-field-line" />{{ t('editor.current') }}
          </span>
          <span class="mt-0.5 block truncate text-xs text-body">銀河鉄道の切符 (Album Mix)</span>
        </span>
      </div>
    </div>
    <p class="mt-2.5 flex justify-end"><GuideMockButton :label="t('editor.resolve')" variant="primary" /></p>
  </div>
</template>
