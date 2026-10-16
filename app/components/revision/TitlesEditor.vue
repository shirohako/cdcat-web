<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import { TITLE_KINDS, TITLE_LOCALES, type Title } from '~/types/entry'

// Multilingual names for entries and series; exactly one is primary.
const titles = defineModel<Title[]>({ required: true })
defineProps<{ error?: string }>()

const { languageName } = useLocaleFormatting()

const add = () => {
  titles.value = [...titles.value, { title: '', locale: null, kind: titles.value.length ? 'official' : 'official', is_primary: titles.value.length === 0 }]
}

const remove = (index: number) => {
  const next = titles.value.filter((_, i) => i !== index)
  if (next.length && !next.some(title => title.is_primary)) next[0]!.is_primary = true
  titles.value = next
}

const setPrimary = (index: number) => {
  titles.value = titles.value.map((title, i) => ({ ...title, is_primary: i === index }))
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="font-medium text-gray-900">{{ $t('catalog.form.titles') }} <span class="text-error">*</span></h3>
        <p class="text-xs text-gray-500">{{ $t('catalog.form.titles_hint') }}</p>
      </div>
      <button type="button" class="btn btn-sm btn-outline shrink-0" @click="add">
        <Plus class="h-4 w-4" />
        {{ $t('catalog.form.add_title') }}
      </button>
    </div>

    <div
      v-for="(item, index) in titles"
      :key="index"
      class="grid grid-cols-1 gap-2 rounded-lg border p-3 md:grid-cols-[1fr_9rem_9rem_auto_auto] md:items-center"
      :class="item.is_primary ? 'border-primary/40 bg-primary/5' : 'border-gray-200'"
    >
      <input
        v-model="item.title"
        type="text"
        maxlength="500"
        class="input input-bordered input-sm w-full"
        :placeholder="$t('catalog.form.title')"
        :aria-label="$t('catalog.form.title')"
      >
      <select v-model="item.locale" class="select select-bordered select-sm w-full" :aria-label="$t('catalog.form.locale')">
        <option :value="null">{{ $t('catalog.form.locale_unknown') }}</option>
        <option v-for="locale in TITLE_LOCALES" :key="locale" :value="locale">{{ languageName(locale) }}</option>
        <option v-if="item.locale && !(TITLE_LOCALES as readonly string[]).includes(item.locale)" :value="item.locale">{{ item.locale }}</option>
      </select>
      <select v-model="item.kind" class="select select-bordered select-sm w-full" :aria-label="$t('catalog.form.kind')">
        <option v-for="kind in TITLE_KINDS" :key="kind" :value="kind">{{ $t(`catalog.title_kind.${kind}`) }}</option>
      </select>
      <label class="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700">
        <input type="radio" class="radio radio-sm radio-primary" :checked="item.is_primary" @change="setPrimary(index)" >
        {{ $t('catalog.form.primary') }}
      </label>
      <button
        type="button"
        class="btn btn-ghost btn-sm text-gray-400 hover:text-error"
        :aria-label="$t('catalog.form.remove')"
        @click="remove(index)"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>

    <p v-if="error" class="text-sm text-error">{{ error }}</p>
  </div>
</template>
