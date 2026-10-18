<template>
  <CatalogSection :title="$t('editor.album.section.basic')" :icon="Info" tone="blue">
    <div class="grid gap-6 p-5 md:grid-cols-[13rem_1fr]">
      <div>
        <p class="mb-1.5 text-sm font-medium text-gray-700">{{ $t('editor.album.cover') }} <span class="text-error">*</span></p>
        <EditorAlbumCoverSlot />
      </div>

      <div class="min-w-0 space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.title') }} <span class="text-error">*</span></span>
          <input v-model="album.title" class="input w-full text-base" :class="{ 'input-error': errorAt('title') }" :placeholder="$t('editor.album.title_placeholder')" maxlength="500">
          <span v-if="errorAt('title')" class="mt-1 block text-xs text-error">{{ errorAt('title') }}</span>
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.release_date') }} <span class="text-error">*</span></span>
            <EditorDateInput v-model:date="album.release_date" v-model:precision="album.release_date_precision" />
            <span v-if="errorAt('release_date')" class="mt-1 block text-xs text-error">{{ errorAt('release_date') }}</span>
          </div>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.type') }} <span class="text-error">*</span></span>
            <select v-model="album.type" class="select select-sm w-full" :class="{ 'select-error': errorAt('type') }">
              <option :value="null" disabled>{{ $t('editor.album.type_placeholder') }}</option>
              <option v-for="value in enums.album_type ?? []" :key="value" :value="value">{{ enumLabel('album_type', value) }}</option>
            </select>
            <span v-if="errorAt('type')" class="mt-1 block text-xs text-error">{{ errorAt('type') }}</span>
          </label>
        </div>

        <div>
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('editor.album.release_event') }}</span>
          <EditorPickedRef v-if="album.release_event_id" :id="album.release_event_id" type="events" :references="references" :icon="CalendarDays" class="max-w-sm" @remove="album.release_event_id = null" />
          <EditorEntityPicker v-else kind="event" class="max-w-sm" :placeholder="$t('editor.album.release_event_placeholder')" @select="pickEvent" />
          <p class="mt-1 text-[11px] text-gray-400">{{ $t('editor.album.release_event_hint') }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.catalog_number') }} <span class="text-[11px] font-normal text-gray-400">· {{ $t('editor.recommended') }}</span></span>
            <input v-model="catalogNumber" class="input input-sm w-full font-mono" placeholder="KICA-1234">
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.barcode') }}</span>
            <input v-model="barcode" class="input input-sm w-full font-mono" inputmode="numeric" maxlength="32">
          </label>
          <p class="text-[11px] text-gray-400 sm:col-span-2">
            {{ $t('editor.album.first_edition_hint') }}
            <button type="button" class="text-primary hover:underline" @click="editor.go('editions')">{{ $t('editor.album.section.editions') }}</button>
          </p>
        </div>

        <div>
          <span class="mb-1.5 block text-sm font-medium text-gray-700">{{ $t('catalog.field.categories') }}</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="value in enums.album_category ?? []"
              :key="value"
              type="button"
              class="rounded-full border px-2.5 py-1 text-xs transition-colors"
              :class="album.categories.includes(value) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
              @click="toggleCategory(value)"
            >{{ enumLabel('album_category', value) }}<span v-if="categoryEn(value)" class="ml-1 opacity-60">{{ categoryEn(value) }}</span></button>
          </div>
          <p v-if="suggestedCategories.length" class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
            {{ $t('editor.album.categories_suggested') }}
            <button v-for="value in suggestedCategories" :key="value" type="button" class="rounded-full border border-dashed border-blue-300 px-2 py-0.5 text-blue-700 hover:bg-blue-50" @click="toggleCategory(value)">+ {{ enumLabel('album_category', value) }}<span v-if="categoryEn(value)" class="ml-1 opacity-60">{{ categoryEn(value) }}</span></button>
          </p>
          <p class="mt-1 text-[11px] text-gray-400">{{ $t('editor.album.categories_hint') }}</p>
        </div>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.description') }}</span>
          <textarea v-model="album.description" rows="4" class="textarea w-full text-sm" :placeholder="$t('editor.album.description_placeholder')" />
        </label>
      </div>
    </div>

    <div class="border-t border-gray-100 px-5 py-4">
      <h3 class="mb-2 text-sm font-semibold text-gray-700">{{ $t('editor.album.other_names') }}</h3>
      <EditorTitleRows v-model="album.titles" />
    </div>

    <details class="border-t border-gray-100 px-5 py-3">
      <summary class="cursor-pointer text-sm font-medium text-gray-600">{{ $t('editor.advanced') }}</summary>
      <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-600">{{ $t('catalog.field.slug') }}</span>
          <input v-model="album.slug" class="input input-sm w-full font-mono" :class="{ 'input-error': errorAt('slug') }" placeholder="my-album-2024">
          <span v-if="errorAt('slug')" class="mt-1 block text-xs text-error">{{ errorAt('slug') }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-600">{{ $t('catalog.field.banner_url') }}</span>
          <input v-model="album.banner_url" type="url" class="input input-sm w-full" placeholder="https://">
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="album.is_adult" type="checkbox" class="checkbox checkbox-sm">{{ $t('editor.album.is_adult') }}
        </label>
      </div>
    </details>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import { CalendarDays, Info } from '@lucide/vue'
import { firstProduct } from '~/utils/albumDocument'

const editor = useAlbumEditor()
const { schema } = useCatalogSchema()
const { enumLabel, enumLabelEn } = useCatalogDisplay()
const { locale } = useI18n()
const { $i18n } = useNuxtApp()

const album = computed(() => editor.album.value)
const references = editor.references
const errorAt = (field: string) => editor.errorAt(field)
const enums = computed(() => schema.value?.enums ?? {})

/** Categories that follow from the linked entries: a game's album is a game album, and so on. */
const ENTRY_CATEGORIES: Record<string, string> = { game: 'game', anime: 'animation', book: 'publication', manga: 'publication', movie: 'live_action', tv: 'live_action', stage: 'live_action' }
const suggestedCategories = computed(() => [...new Set(album.value.entries
  .map(row => typeof row.entry_id === 'number' ? ENTRY_CATEGORIES[String((references.entry?.[String(row.entry_id)] as { type?: string } | undefined)?.type)] : undefined)
  .filter((value): value is string => !!value && !album.value.categories.includes(value)))])

// Outside the English UI each category also shows its English name. Only the UI language's
// messages are loaded up front, so the English ones are fetched here.
const categoryEn = (value: string) => locale.value === 'en' ? '' : enumLabelEn('album_category', value)
const loadEnglish = () => {
  if (locale.value !== 'en') $i18n.loadLocaleMessages('en')
}
onMounted(loadEnglish)
watch(locale, loadEnglish)

const toggleCategory = (value: string) => {
  const categories = album.value.categories
  album.value.categories = categories.includes(value) ? categories.filter(item => item !== value) : [...categories, value]
}

/** Catalog number and barcode belong to editions; these edit the first one, adding it when needed. */
const catalogNumber = computed({
  get: () => firstProduct(album.value)?.catalog_number ?? '',
  set: (value: string) => {
    const product = firstProduct(album.value, !!value.trim())
    if (product) product.catalog_number = value
  },
})
const barcode = computed({
  get: () => firstProduct(album.value)?.barcode ?? '',
  set: (value: string) => {
    const product = firstProduct(album.value, !!value.trim())
    if (product) product.barcode = value
  },
})

const pickEvent = (event: PickedEntity) => {
  editor.remember('events', event.id, { id: event.id, name: event.label })
  album.value.release_event_id = event.id
}
</script>
