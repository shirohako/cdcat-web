<script setup lang="ts">
import { COMMON_LANGUAGES } from '~/utils/contentLanguages'

/**
 * 其他名称怎么选: the "add a name" dialog with the real labels and the made-up album's official English title being
 * added: the three kinds as cards in their own colours (official chosen), the language chips (English chosen) and the
 * tips line.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()
const { localeName } = useCatalogDisplay()

const GROUPS = [
  { key: 'official', icon: 'lucide:badge-check', on: 'border-blue-400 bg-blue-50/70 ring-1 ring-blue-200 dark:bg-blue-400/15 dark:ring-blue-400/25', title: 'text-blue-700 dark:text-blue-300' },
  { key: 'translation', icon: 'lucide:languages' },
  { key: 'alias', icon: 'lucide:tags' },
]
</script>

<template>
  <div class="mx-auto max-w-xl overflow-hidden rounded-lg bg-popover shadow-overlay ring-1 ring-line" aria-hidden="true">
    <div class="flex items-start gap-2.5 border-b border-line px-4 py-3">
      <span class="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Icon name="lucide:type" class="size-4" /></span>
      <span class="min-w-0">
        <span class="block text-[13px] font-semibold text-title">{{ t('editor.add_name') }}</span>
        <span class="block text-[11px] leading-4 text-meta">{{ t('editor.names_hint') }}</span>
      </span>
    </div>
    <div class="space-y-3 px-4 py-3">
      <GuideMockField :label="t('catalog.field.title')" value="Atlas of Stardust" />
      <div>
        <p class="mb-1.5 text-[11px] font-medium text-body">{{ t('editor.names.question') }}</p>
        <div class="grid gap-1.5 sm:grid-cols-3">
          <div
            v-for="group in GROUPS"
            :key="group.key"
            class="rounded-md border px-2.5 py-2"
            :class="group.on ?? 'border-line'"
          >
            <p class="flex items-center gap-1.5 text-xs font-semibold" :class="group.title ?? 'text-title'">
              <Icon :name="group.icon" class="size-3.5 shrink-0" />{{ t(`editor.names.${group.key}`) }}
            </p>
            <p class="mt-1 line-clamp-3 text-[10px] leading-3.5 text-meta">{{ t(`editor.names.${group.key}_hint`) }}</p>
          </div>
        </div>
      </div>
      <div>
        <p class="mb-1.5 text-[11px] font-medium text-body">{{ t('catalog.field.locale') }}</p>
        <p class="flex flex-wrap gap-1">
          <GuideMockChip v-for="code in COMMON_LANGUAGES" :key="code" :label="localeName(code)" :selected="code === 'en'" />
          <span class="inline-flex h-5 items-center gap-1 rounded-md border border-field-line px-1.5 text-[11px] text-faint">
            {{ t('editor.dialog.locale_other') }}<Icon name="lucide:chevron-down" class="size-3" />
          </span>
        </p>
      </div>
      <p class="flex items-center gap-1.5 text-[11px] text-meta">
        <Icon name="lucide:lightbulb" class="size-3.5 shrink-0" />{{ t('editor.names.tip_title') }}<Icon name="lucide:chevron-down" class="size-3" />
      </p>
    </div>
    <div class="flex justify-end gap-1.5 border-t border-line bg-sunken/60 px-4 py-2.5">
      <GuideMockButton :label="t('common.cancel')" />
      <GuideMockButton :label="t('common.add')" variant="primary" />
    </div>
  </div>
</template>
