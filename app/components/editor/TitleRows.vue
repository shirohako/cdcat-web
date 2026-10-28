<template>
  <div class="space-y-2">
    <p class="text-xs text-meta">{{ $t('editor.names_hint') }}</p>
    <ul v-if="rows.length" class="space-y-1.5">
      <EditorListRow v-for="row in rows" :key="row.id" :invalid="!row.title.trim()" @edit="edit(row)" @remove="remove(row)">
        <span class="min-w-0 truncate text-sm font-medium text-title">{{ row.title || '—' }}</span>
        <span class="shrink-0 rounded-md px-1.5 py-0.5 text-[11px]" :class="GROUPS[groupOf(row.kind)].chip">{{ enumLabel('title_kind', row.kind) }}</span>
        <span v-if="row.locale" class="shrink-0 rounded-md bg-btn px-1.5 py-0.5 text-[11px] text-btn-content" :title="row.locale">{{ localeName(row.locale) }}</span>
      </EditorListRow>
    </ul>
    <EditorAddButton @click="edit(null)">{{ $t('editor.add_name') }}</EditorAddButton>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.name_edit' : 'editor.add_name')" :description="$t('editor.names_hint')" :icon="Type" @submit="save">
      <div class="space-y-5">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.title') }}</span>
          <input v-model="form.title" data-autofocus class="input w-full" :class="{ 'input-error': tried && !form.title.trim() }" maxlength="500">
          <span v-if="tried && !form.title.trim()" class="mt-1 block text-xs text-danger">{{ $t('editor.dialog.name_required') }}</span>
        </label>

        <fieldset>
          <legend class="mb-1.5 text-sm font-medium text-body">{{ $t('editor.names.question') }}</legend>
          <div class="grid gap-2 sm:grid-cols-3">
            <button
              v-for="(group, key) in GROUPS"
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
              <span class="text-[11px] leading-4 text-meta">{{ $t(`editor.names.${key}_hint`) }}</span>
            </button>
          </div>
        </fieldset>

        <div>
          <span class="mb-1.5 block text-sm font-medium text-body">
            {{ $t('catalog.field.locale') }}<span v-if="form.group === 'alias'" class="font-normal text-meta"> · {{ $t('editor.names.optional') }}</span>
          </span>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="code in languages"
              :key="code"
              type="button"
              class="chip chip-sm"
              :class="{ 'chip-selected': form.locale === code }"
              :aria-pressed="form.locale === code"
              :title="code"
              @click="form.locale = form.locale === code ? '' : code"
            >{{ localeName(code) }}</button>
            <span class="flex items-center gap-0.5">
              <UiLanguageSelect
                v-model="otherLocale"
                :readings="form.group !== 'official'"
                :placeholder="$t('editor.dialog.locale_other')"
                :aria-label="$t('catalog.field.locale')"
                size="sm"
                class="w-40"
              />
              <UiButton v-if="otherLocale" icon="lucide:x" :label="$t('common.clear')" size="xs" @click="form.locale = ''" />
            </span>
          </div>
          <span v-if="localeProblem" class="mt-1 block text-xs text-danger">{{ localeProblem }}</span>
          <span v-else-if="kind === 'transliteration'" class="mt-1 block text-[11px] text-meta">{{ $t('editor.names.reading_note') }}</span>
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
            <li v-for="line in TIPS" :key="line">{{ $t(`editor.names.tip_${line}`) }}</li>
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
import type { Component } from 'vue'
import type { CatalogTitleKind } from '~/types/catalog'
import type { TitleRow } from '~/types/document'
import { BadgeCheck, ChevronDown, Languages, Lightbulb, Tags, Type } from '@lucide/vue'
import { COMMON_LANGUAGES, isReading, READINGS } from '~/utils/contentLanguages'
import { newKey } from '~/utils/documentKeys'
import { nextOrder } from '~/utils/documentRows'

/**
 * Other names of an aggregate, added and edited in a dialog. Instead of picking one of the five
 * title kinds, the editor says what sort of name it is and in which language, and the kind follows:
 * official → official; translation → translation, or transliteration for a reading such as ja-Latn;
 * other → alias, or abbreviation when ticked.
 */
const rows = defineModel<TitleRow[]>({ required: true })
const { t } = useI18n()
const { enumLabel, localeName } = useCatalogDisplay()

type Group = 'official' | 'translation' | 'alias'

const GROUPS: Record<Group, { icon: Component, active: string, text: string, chip: string }> = {
  official: { icon: BadgeCheck, active: 'border-blue-400 bg-blue-50/70 ring-1 ring-blue-200 dark:bg-blue-400/15 dark:ring-blue-400/25', text: 'text-blue-700 dark:text-blue-300', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300' },
  translation: { icon: Languages, active: 'border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:ring-emerald-400/25', text: 'text-emerald-700 dark:text-emerald-300', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300' },
  alias: { icon: Tags, active: 'border-meta bg-sunken ring-1 ring-line', text: 'text-title', chip: 'bg-btn text-btn-content' },
}
const TIPS = ['shown', 'count', 'search', 'unsure'] as const
const groupOf = (kind: CatalogTitleKind): Group =>
  kind === 'official' ? 'official' : kind === 'translation' || kind === 'transliteration' ? 'translation' : 'alias'

const remove = (row: TitleRow) => {
  const index = rows.value.indexOf(row)
  if (index >= 0) rows.value.splice(index, 1)
}

// ---- the dialog ----

const dialog = ref(false)
const editing = ref<TitleRow | null>(null)
const form = reactive({ title: '', group: 'translation' as Group, locale: '', abbreviation: false })
const tried = ref(false)

/** An official name is never a reading, so readings are offered for translations and other names only. */
const languages = computed(() => form.group === 'official' ? COMMON_LANGUAGES : [...COMMON_LANGUAGES, ...READINGS])
/** The chips have the usual languages and the select next to them the rest; it shows a language only when no chip has it. */
const otherLocale = computed({
  get: () => languages.value.includes(form.locale) ? '' : form.locale,
  set: (code: string) => { form.locale = code },
})

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
  form.group = row ? groupOf(row.kind) : 'translation'
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
