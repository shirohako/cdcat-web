<template>
  <div class="flex flex-col gap-2">
    <!-- 已选活动 -->
    <div v-if="modelValue" class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <CalendarDays :size="16" class="shrink-0 text-amber-500" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-gray-800">{{ selected?.name ?? `#${modelValue}` }}</p>
        <p v-if="selected" class="truncate text-xs text-gray-400">{{ describe(selected) }}</p>
      </div>
      <button type="button" class="btn btn-xs btn-ghost text-gray-400 hover:text-error hover:bg-error/10" :aria-label="t('event_picker.clear')" @click="choose(null)">
        <X :size="13" />
      </button>
    </div>

    <!-- 搜索 -->
    <div v-else class="relative">
      <Search :size="14" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        v-model="search"
        type="search"
        maxlength="100"
        :placeholder="t('event_picker.placeholder')"
        :aria-label="t('event_picker.placeholder')"
        class="input input-bordered input-sm w-full bg-white pl-8"
      >
      <ul v-if="search.trim()" class="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
        <li v-if="searching" class="px-3 py-2 text-xs text-gray-400">{{ t('event_picker.searching') }}</li>
        <li v-else-if="!results.length" class="px-3 py-2 text-xs text-gray-400">{{ t('event_picker.no_results') }}</li>
        <li v-for="event in results" :key="event.id">
          <button type="button" class="w-full px-3 py-2 text-left hover:bg-gray-50" @click="choose(event)">
            <span class="block truncate text-sm text-gray-800">{{ event.name }}</span>
            <span class="block truncate text-xs text-gray-400">{{ describe(event) }}</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- 按发行日期推荐 -->
    <div v-if="!modelValue && suggestions.length" class="flex flex-wrap items-center gap-2">
      <span class="text-xs text-gray-400">{{ t('event_picker.on_release_date') }}</span>
      <button
        v-for="event in suggestions"
        :key="event.id"
        type="button"
        class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700 hover:bg-amber-100"
        @click="choose(event)"
      >
        {{ event.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, Search, X } from '@lucide/vue'
import type { EventOption } from '~/composables/useEventSearch'

// Form-style event chooser for the album editor, with release-date suggestions.
// The albums list uses the chip-style EventFilterChip instead.
const props = defineProps<{
  modelValue: number | null
  releaseDate?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { $api } = useNuxtApp()
const { t } = useI18n()
const describe = describeEvent

// An existing album only carries the id, so resolve the name for display.
const { selected } = useEventLookup(toRef(props, 'modelValue'))
const { search, results, searching } = useEventSearch()
const choose = (event: EventOption | null) => {
  selected.value = event
  search.value = ''
  emit('update:modelValue', event?.id ?? null)
}

// ===== Suggestions =====
// Events running on the release date; Comic Market spans up to four days, so look back three.
const suggestions = ref<EventOption[]>([])
watch(() => props.releaseDate, async (date) => {
  suggestions.value = []
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
  const from = new Date(`${date}T00:00:00Z`)
  from.setUTCDate(from.getUTCDate() - 3)
  try {
    const page = await $api<{ events: EventOption[] }>('/v1/events', {
      query: { start_from: from.toISOString().slice(0, 10), start_to: date, per_page: 10 },
      progress: false,
    })
    if (props.releaseDate === date) suggestions.value = page.events.filter(event => eventCoversDate(event, date))
  } catch {
    suggestions.value = []
  }
}, { immediate: true })
</script>
