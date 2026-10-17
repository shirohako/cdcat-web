<template>
  <div class="space-y-2">
    <div v-for="(row, index) in rows" :key="row.id" class="flex flex-wrap items-center gap-2">
      <input v-model="row.title" class="input input-sm min-w-48 flex-1" :placeholder="$t('catalog.field.title')">
      <select v-model="row.kind" class="select select-sm w-32">
        <option v-for="kind in TITLE_KINDS" :key="kind" :value="kind">{{ enumLabel('title_kind', kind) }}</option>
      </select>
      <input v-model="row.locale" list="editor-title-locales" class="input input-sm w-28" :placeholder="$t('catalog.field.locale')" @change="row.locale = row.locale?.trim() || null">
      <button type="button" class="btn btn-ghost btn-sm px-2" :aria-label="$t('common.delete')" @click="rows.splice(index, 1)"><Trash2 :size="14" /></button>
    </div>
    <datalist id="editor-title-locales">
      <option v-for="code in LOCALES" :key="code" :value="code">{{ localeName(code) }}</option>
    </datalist>
    <button type="button" class="btn btn-ghost btn-xs gap-1" @click="add"><Plus :size="12" />{{ $t('editor.add_name') }}</button>
    <p class="text-[11px] text-gray-400">{{ $t('editor.names_hint') }}</p>
  </div>
</template>

<script setup lang="ts">
import type { TitleRow } from '~/types/document'
import { TITLE_KINDS } from '~/types/catalog'
import { Plus, Trash2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { nextOrder } from '~/utils/documentRows'

const rows = defineModel<TitleRow[]>({ required: true })
const { enumLabel, localeName } = useCatalogDisplay()
const LOCALES = ['ja', 'ja-Latn', 'ja-Hrkt', 'zh-Hans', 'zh-Hant', 'en', 'ko']

const add = () => rows.value.push({ id: newKey('t'), title: '', locale: null, kind: 'alias', sort_order: nextOrder(rows.value) })
</script>
