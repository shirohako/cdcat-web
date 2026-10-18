<script setup lang="ts">
import { Lock, Plus, X } from '@lucide/vue'
import type { TagSummary } from '~/types/article'
import { TAG_NAME_MAX, cleanTagName, isNewTag, newTag, tagKey } from '~/utils/tags'

/**
 * Picks tags from the shared library, or names a new one: typing a name the library lacks offers
 * to create it, and it is created when the article or topic is saved. A name matching a tag (or
 * one of its translations) picks that tag instead. Staff-only tags are offered only to managers.
 */
const props = withDefaults(defineProps<{ max?: number, disabled?: boolean, allowStaff?: boolean }>(), { max: 5, disabled: false, allowStaff: false })
const model = defineModel<TagSummary[]>({ required: true })
const { t } = useI18n()
const { tags, pending, tagName } = useTags()
const filter = ref('')

const namesOf = (tag: TagSummary) => [tag.name, ...Object.values(tag.translations ?? {}).map(translation => translation?.name ?? '')].filter(Boolean)
const chosen = (tag: TagSummary) => model.value.some(selected => selected.id === tag.id)
const available = computed(() => {
  const term = filter.value.trim().toLowerCase()
  return tags.value.filter(tag => (props.allowStaff || !tag.is_staff_only)
    && !chosen(tag)
    && (!term || tagName(tag).toLowerCase().includes(term) || tag.slug.includes(term)))
})
const full = computed(() => model.value.length >= props.max)

/** The typed name, and the library tag it names, if any. */
const typed = computed(() => cleanTagName(filter.value))
const match = computed(() => {
  if (!typed.value) return null
  const key = tagKey(typed.value)
  return tags.value.find(tag => namesOf(tag).some(name => tagKey(name) === key)) ?? null
})
const alreadyPicked = computed(() => !!typed.value && (model.value.some(tag => tagKey(tag.name) === tagKey(typed.value)) || (!!match.value && chosen(match.value))))
const staffOnly = computed(() => !!match.value?.is_staff_only && !props.allowStaff)
const tooLong = computed(() => typed.value.length > TAG_NAME_MAX)
const canCreate = computed(() => !!typed.value && !match.value && !alreadyPicked.value && !tooLong.value)

const add = (tag: TagSummary) => {
  if (full.value || props.disabled || chosen(tag)) return
  model.value = [...model.value, tag]
  filter.value = ''
}
const create = () => { if (canCreate.value && !full.value) add(newTag(typed.value)) }
const remove = (tag: TagSummary) => { model.value = model.value.filter(selected => selected.id !== tag.id) }

/** Enter picks the tag the name matches, or creates it. */
const onEnter = () => {
  if (match.value && (props.allowStaff || !match.value.is_staff_only)) add(match.value)
  else create()
}
</script>

<template>
  <div class="space-y-2">
    <div v-if="model.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in model" :key="tag.id"
        class="inline-flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs font-medium ring-1"
        :class="isNewTag(tag) ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-violet-50 text-violet-700 ring-violet-200'">
        <Lock v-if="tag.is_staff_only" :size="10" />
        {{ tagName(tag) }}
        <span v-if="isNewTag(tag)" class="rounded-full bg-emerald-100 px-1 text-[10px] font-bold">{{ t('article_ui.tags.new') }}</span>
        <button
          type="button" class="grid size-4 place-items-center rounded-full hover:bg-black/5 disabled:opacity-40" :disabled="disabled"
          :aria-label="t('article_ui.tags.remove', { name: tagName(tag) })" @click="remove(tag)">
          <X :size="10" />
        </button>
      </span>
    </div>
    <template v-if="!disabled">
      <input
        v-model="filter" type="search" maxlength="60" :disabled="full"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none placeholder:text-slate-300 focus:border-violet-400"
        :placeholder="full ? t('article_ui.tags.full', { max }) : t('article_ui.tags.filter')"
        @keydown.enter.prevent="onEnter">
      <p v-if="pending" class="text-xs text-slate-400">{{ t('common.loading') }}</p>
      <div v-else-if="!full" class="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
        <button
          v-if="canCreate" type="button"
          class="inline-flex items-center gap-1 rounded-full border border-dashed border-emerald-400 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
          @click="create">
          <Plus :size="10" />{{ t('article_ui.tags.create', { name: typed }) }}
        </button>
        <button
          v-for="tag in available" :key="tag.id" type="button"
          class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
          @click="add(tag)">
          <Plus :size="10" />{{ tagName(tag) }}
        </button>
        <p v-if="!available.length && !canCreate" class="text-xs text-slate-400">
          {{ tooLong ? t('article_ui.tags.errors.too_long', { max: TAG_NAME_MAX }) : alreadyPicked ? t('article_ui.tags.picked') : staffOnly ? t('article_ui.tags.errors.staff') : tags.length || typed ? t('article_ui.tags.no_match') : t('article_ui.tags.empty') }}
        </p>
      </div>
      <p v-if="!full" class="text-[11px] text-slate-400">{{ t('article_ui.tags.create_hint', { max: TAG_NAME_MAX }) }}</p>
    </template>
  </div>
</template>
