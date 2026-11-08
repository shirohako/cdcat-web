<template>
  <div class="space-y-2">
    <p class="text-xs text-meta">{{ hint }}</p>
    <ul v-if="shown.length" class="space-y-1.5">
      <EditorListRow v-for="row in shown" :key="row.id" :invalid="!row.title.trim()" @edit="edit(row)" @remove="remove(row)">
        <span class="min-w-0 truncate text-sm font-medium text-title">{{ row.title || '—' }}</span>
        <span class="shrink-0 rounded-md px-1.5 py-0.5 text-11" :class="TITLE_GROUPS[titleGroupOf(row.kind)].chip">{{ enumLabel('title_kind', row.kind) }}</span>
        <span v-if="row.locale" class="shrink-0 rounded-md bg-btn px-1.5 py-0.5 text-11 text-btn-content" :title="row.locale">{{ localeName(row.locale) }}</span>
      </EditorListRow>
    </ul>
    <EditorAddButton @click="edit(null)">{{ $t('editor.add_name') }}</EditorAddButton>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.name_edit' : 'editor.add_name')" :description="hint" :icon="Type" @submit="save">
      <div class="space-y-5">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.title') }}</span>
          <input v-model="form.title" data-autofocus class="input w-full" :class="{ 'input-error': tried && !form.title.trim() }" maxlength="500">
          <span v-if="tried && !form.title.trim()" class="mt-1 block text-xs text-danger">{{ $t('editor.dialog.name_required') }}</span>
        </label>

        <fieldset v-if="groups.length > 1">
          <legend class="mb-1.5 text-sm font-medium text-body">{{ $t('editor.names.question') }}</legend>
          <div class="grid gap-2" :class="groups.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'">
            <button
              v-for="(group, key) in offered"
              :key="key"
              type="button"
              class="flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors"
              :class="form.group === key ? group.active : 'border-line hover:bg-card-hover'"
              :aria-pressed="form.group === key"
              @click="form.group = key"
            >
              <span class="flex items-center gap-1.5 text-sm font-semibold" :class="form.group === key ? group.text : 'text-title'">
                <component :is="group.icon" :size="14" class="shrink-0" />{{ $t(`editor.names.${key}`) }}
              </span>
              <span class="text-11 leading-4 text-meta">{{ $t(`editor.names.${key}_hint`) }}</span>
            </button>
          </div>
        </fieldset>

        <div>
          <span class="mb-1.5 block text-sm font-medium text-body">
            {{ $t('catalog.field.locale') }}<span v-if="form.group === 'alias'" class="font-normal text-meta"> · {{ $t('editor.names.optional') }}</span>
          </span>
          <span class="flex items-center gap-0.5">
            <UiLanguageSelect v-model="form.locale" :readings="form.group !== 'official'" :aria-label="$t('catalog.field.locale')" size="sm" class="w-60" />
            <!-- Only an alias can go without a language. -->
            <UiButton v-if="form.group === 'alias' && form.locale" icon="lucide:x" :label="$t('common.clear')" size="xs" @click="form.locale = ''" />
          </span>
          <span v-if="localeProblem" class="mt-1 block text-xs text-danger">{{ localeProblem }}</span>
          <span v-else-if="kind === 'transliteration'" class="mt-1 block text-11 text-meta">{{ $t('editor.names.reading_note') }}</span>
        </div>

        <label v-if="form.group === 'alias'" class="flex items-center gap-2 text-sm text-body">
          <input v-model="form.abbreviation" type="checkbox" class="checkbox checkbox-sm">{{ $t('editor.names.is_abbreviation') }}
        </label>

        <details class="group rounded-xl border border-warning/25 bg-warning/10 px-3.5 py-2.5 text-xs text-body">
          <summary class="flex cursor-pointer list-none items-center gap-1.5 font-semibold text-title">
            <Lightbulb :size="14" class="shrink-0 text-warning" />{{ $t('editor.names.tip_title') }}
            <ChevronDown :size="13" class="ml-auto shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <ul class="mt-2 list-disc space-y-1 pl-4 leading-5">
            <li v-for="line in TITLE_TIPS" :key="line">{{ $t(`editor.names.tip_${line}`) }}</li>
          </ul>
        </details>
      </div>
      <template #footer>
        <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="dialog = false">{{ $t('common.cancel') }}</UiButton>
        <UiButton type="submit" variant="primary" size="sm" class="shadow-xs active:translate-y-px">{{ $t(editing ? 'common.save' : 'common.add') }}</UiButton>
      </template>
    </EditorModal>
  </div>
</template>

<script setup lang="ts">
import type { CatalogTitleKind } from '~/types/catalog'
import type { TitleRow } from '~/types/document'
import type { TitleGroup } from '~/utils/titleGroups'
import { ChevronDown, Lightbulb, Type } from '@lucide/vue'
import { isReading } from '~/utils/contentLanguages'
import { newKey } from '~/utils/documentKeys'
import { nextOrder } from '~/utils/documentRows'
import { TITLE_GROUPS, TITLE_TIPS, titleGroupOf } from '~/utils/titleGroups'

/**
 * Other names of an aggregate, added and edited in a dialog. Instead of picking one of the five
 * title kinds, the editor says what sort of name it is and in which language, and the kind follows
 * (utils/titleGroups). `groups` keeps it to some of the sorts: the album's translator lists only its
 * aliases here, its translations being whole tracklists.
 */
const rows = defineModel<TitleRow[]>({ required: true })
const props = withDefaults(defineProps<{ groups?: TitleGroup[] }>(), { groups: () => ['official', 'translation', 'alias'] })
const { t } = useI18n()
const { enumLabel, localeName } = useCatalogDisplay()

type Group = TitleGroup
const groupOf = titleGroupOf
const offered = computed(() => Object.fromEntries(props.groups.map(key => [key, TITLE_GROUPS[key]])) as Partial<typeof TITLE_GROUPS>)
const shown = computed(() => rows.value.filter(row => props.groups.includes(groupOf(row.kind as CatalogTitleKind))))
const hint = computed(() => props.groups.length === 1 && props.groups[0] === 'alias' ? t('editor.names.alias_hint') : t('editor.names_hint'))

const remove = (row: TitleRow) => {
  const index = rows.value.indexOf(row)
  if (index >= 0) rows.value.splice(index, 1)
}

// ---- the dialog ----

const dialog = ref(false)
const editing = ref<TitleRow | null>(null)
const form = reactive({ title: '', group: 'translation' as Group, locale: '', abbreviation: false })
const tried = ref(false)

const kind = computed<CatalogTitleKind>(() => {
  if (form.group === 'official') return 'official'
  if (form.group === 'translation') return isReading(form.locale) ? 'transliteration' : 'translation'
  return form.abbreviation ? 'abbreviation' : 'alias'
})

/** Official names and translations need a language, and the catalog keeps one of each per language. */
const localeProblem = computed(() => {
  if (!tried.value || form.group === 'alias') return null
  if (!form.locale) return t('editor.names.locale_required')
  if (form.group === 'official' && isReading(form.locale)) return t('editor.names.official_reading')
  const taken = rows.value.some(row => row !== editing.value && row.locale === form.locale && row.kind === kind.value)
  return taken ? t('editor.names.duplicate', { kind: enumLabel('title_kind', kind.value), language: localeName(form.locale) }) : null
})

const edit = (row: TitleRow | null) => {
  editing.value = row
  form.title = row?.title ?? ''
  form.group = row ? groupOf(row.kind) : props.groups.includes('translation') ? 'translation' : props.groups[0]!
  form.locale = row?.locale ?? ''
  form.abbreviation = row?.kind === 'abbreviation'
  tried.value = false
  dialog.value = true
}

const save = () => {
  tried.value = true
  const title = form.title.trim()
  if (!title || localeProblem.value) return
  const values = { title, kind: kind.value, locale: form.locale.trim() || null }
  if (editing.value) Object.assign(editing.value, values)
  else rows.value.push({ id: newKey('t'), ...values, sort_order: nextOrder(rows.value) })
  dialog.value = false
}
</script>
