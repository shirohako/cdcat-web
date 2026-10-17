<script setup lang="ts">
import { Lock, Plus, X } from '@lucide/vue'
import type { TagSummary } from '~/types/article'

/** Picks tags from the shared library; staff-only tags are offered only to managers. */
const props = withDefaults(defineProps<{ max?: number, disabled?: boolean, allowStaff?: boolean }>(), { max: 5, disabled: false, allowStaff: false })
const model = defineModel<TagSummary[]>({ required: true })
const { t } = useI18n()
const { tags, pending, tagName } = useTags()
const filter = ref('')

const available = computed(() => {
  const term = filter.value.trim().toLowerCase()
  return tags.value.filter(tag => (props.allowStaff || !tag.is_staff_only)
    && !model.value.some(selected => selected.id === tag.id)
    && (!term || tagName(tag).toLowerCase().includes(term) || tag.slug.includes(term)))
})
const full = computed(() => model.value.length >= props.max)

const add = (tag: TagSummary) => { if (!full.value && !props.disabled) model.value = [...model.value, tag] }
const remove = (tag: TagSummary) => { model.value = model.value.filter(selected => selected.id !== tag.id) }
</script>

<template>
  <div class="space-y-2">
    <div v-if="model.length" class="flex flex-wrap gap-1.5">
      <span v-for="tag in model" :key="tag.id" class="inline-flex items-center gap-1 rounded-full bg-violet-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
        <Lock v-if="tag.is_staff_only" :size="10" />
        {{ tagName(tag) }}
        <button
          type="button" class="grid size-4 place-items-center rounded-full hover:bg-violet-100 disabled:opacity-40" :disabled="disabled"
          :aria-label="t('article_ui.tags.remove', { name: tagName(tag) })" @click="remove(tag)">
          <X :size="10" />
        </button>
      </span>
    </div>
    <template v-if="!disabled">
      <input
        v-model="filter" type="search" maxlength="50" :disabled="full"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none placeholder:text-slate-300 focus:border-violet-400"
        :placeholder="full ? t('article_ui.tags.full', { max }) : t('article_ui.tags.filter')">
      <p v-if="pending" class="text-xs text-slate-400">{{ t('common.loading') }}</p>
      <div v-else-if="!full" class="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
        <button
          v-for="tag in available" :key="tag.id" type="button"
          class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
          @click="add(tag)">
          <Plus :size="10" />{{ tagName(tag) }}
        </button>
        <p v-if="!available.length" class="text-xs text-slate-400">{{ tags.length ? t('article_ui.tags.no_match') : t('article_ui.tags.empty') }}</p>
      </div>
    </template>
  </div>
</template>
