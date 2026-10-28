<template>
  <CatalogSection :title="$t('editor.album.section.basic')" :icon="Info">
    <div class="grid gap-6 p-5 md:grid-cols-[13rem_1fr]">
      <div>
        <p class="mb-1.5 text-sm font-medium text-body">{{ $t('editor.album.cover') }} <span class="text-danger">*</span></p>
        <EditorAlbumCoverSlot />
      </div>

      <div class="min-w-0 space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.title') }} <span class="text-danger">*</span></span>
          <input v-model="album.title" class="input w-full text-base" :class="{ 'input-error': errorAt('title') }" :placeholder="$t('editor.album.title_placeholder')" maxlength="500">
          <span v-if="errorAt('title')" class="mt-1 block text-xs text-danger">{{ errorAt('title') }}</span>
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.release_date') }} <span class="text-danger">*</span></span>
            <EditorDateInput v-model:date="album.release_date" v-model:precision="album.release_date_precision" />
            <span v-if="errorAt('release_date')" class="mt-1 block text-xs text-danger">{{ errorAt('release_date') }}</span>
          </div>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.type') }} <span class="text-danger">*</span></span>
            <UiSelect v-model="album.type" :options="typeOptions" :placeholder="$t('editor.album.type_placeholder')" size="sm" class="w-full" :invalid="!!errorAt('type')" />
            <span v-if="errorAt('type')" class="mt-1 block text-xs text-danger">{{ errorAt('type') }}</span>
          </label>
        </div>

        <div>
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.album.release_event') }}</span>
          <EditorPickedRef v-if="album.release_event_id" :id="album.release_event_id" type="events" :references="references" :icon="CalendarDays" class="max-w-sm" @remove="album.release_event_id = null" />
          <EditorEntityPicker v-else kind="event" class="max-w-sm" :placeholder="$t('editor.album.release_event_placeholder')" @select="pickEvent" />
          <p class="mt-1 text-[11px] text-meta">{{ $t('editor.album.release_event_hint') }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.catalog_number') }} <span class="text-[11px] font-normal text-meta">· {{ $t('editor.recommended') }}</span></span>
            <input v-model="catalogNumber" class="input input-sm w-full font-mono" placeholder="KICA-1234">
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.barcode') }}</span>
            <input v-model="barcode" class="input input-sm w-full font-mono" inputmode="numeric" maxlength="32">
          </label>
          <p class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-meta sm:col-span-2">
            {{ $t('editor.album.first_edition_hint') }}
            <UiButton
              variant="outline"
              size="xs"
              :icon-right="ChevronRight"
              icon-class="size-3 transition-transform group-hover:translate-x-0.5"
              class="group gap-0.5"
              @click="editor.go('editions')"
            >{{ $t('editor.album.section.editions') }}</UiButton>
          </p>
        </div>

        <div>
          <span class="mb-1.5 block text-sm font-medium text-body">{{ $t('catalog.field.categories') }}</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="value in enums.album_category ?? []"
              :key="value"
              type="button"
              class="chip chip-sm"
              :class="{ 'chip-selected': album.categories.includes(value) }"
              @click="toggleCategory(value)"
            >{{ enumLabel('album_category', value) }}<span v-if="categoryEn(value)" class="ml-1 opacity-60">{{ categoryEn(value) }}</span></button>
          </div>
          <p v-if="suggestedCategories.length" class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-meta">
            {{ $t('editor.album.categories_suggested') }}
            <UiButton v-for="value in suggestedCategories" :key="value" variant="add" size="xs" icon="lucide:plus" icon-class="size-3" class="gap-1 shadow-xs active:translate-y-px" @click="toggleCategory(value)">{{ enumLabel('album_category', value) }}<span v-if="categoryEn(value)" class="opacity-60">{{ categoryEn(value) }}</span></UiButton>
          </p>
          <p class="mt-1 text-[11px] text-meta">{{ $t('editor.album.categories_hint') }}</p>
        </div>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.description') }}</span>
          <textarea v-model="album.description" rows="4" class="textarea w-full text-sm" :placeholder="$t('editor.album.description_placeholder')" />
        </label>
      </div>
    </div>

    <div class="border-t border-line px-5 py-4">
      <h3 class="mb-1 text-sm font-semibold text-body">{{ $t('editor.album.other_names') }}</h3>
      <EditorTitleRows v-model="album.titles" />
    </div>

    <div class="border-t border-line px-5 py-4">
      <h3 class="mb-3 text-sm font-semibold text-body">{{ $t('editor.advanced') }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-body">{{ $t('catalog.field.slug') }}</span>
          <input v-model="album.slug" class="input input-sm w-full font-mono" :class="{ 'input-error': errorAt('slug') }" placeholder="my-album-2024">
          <span v-if="errorAt('slug')" class="mt-1 block text-xs text-danger">{{ errorAt('slug') }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-body">{{ $t('catalog.field.banner_url') }}</span>
          <input v-model="album.banner_url" type="url" class="input input-sm w-full" placeholder="https://">
        </label>
        <label class="flex items-center gap-2 text-sm text-body">
          <input v-model="album.is_adult" type="checkbox" class="checkbox checkbox-sm">{{ $t('editor.album.is_adult') }}
        </label>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { CalendarDays, ChevronRight, Info } from '@lucide/vue'
import { firstProduct } from '~/utils/albumDocument'

const editor = useAlbumEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const { labelEn } = useEnglishLabels()

const album = computed(() => editor.album.value)
const references = editor.references
const errorAt = (field: string) => editor.errorAt(field)
const enums = computed(() => schema.value?.enums ?? {})
const typeOptions = computed<UiSelectOption<string | null>[]>(() => (enums.value.album_type ?? []).map(value => ({ value, label: enumLabel('album_type', value) })))

/** Categories that follow from the linked entries: a game's album is a game album, and so on. */
const ENTRY_CATEGORIES: Record<string, string> = { game: 'game', anime: 'animation', book: 'publication', manga: 'publication', movie: 'live_action', tv: 'live_action', stage: 'live_action' }
const suggestedCategories = computed(() => [...new Set(album.value.entries
  .map(row => typeof row.entry_id === 'number' ? ENTRY_CATEGORIES[String((references.entry?.[String(row.entry_id)] as { type?: string } | undefined)?.type)] : undefined)
  .filter((value): value is string => !!value && !album.value.categories.includes(value)))])

// Outside the English UI each category also shows its English name.
const categoryEn = (value: string) => labelEn('album_category', value)

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
