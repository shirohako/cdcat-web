<template>
  <div ref="root" class="relative">
    <!-- 已选：与选中的类型 chip 同色，点名称换一个，点 × 清除 -->
    <div v-if="modelValue" class="inline-flex h-8 items-center rounded-lg text-xs font-medium ring-1 ring-inset" :class="activeClass">
      <button type="button" class="inline-flex h-full max-w-56 items-center gap-1.5 pl-3 pr-1.5" :aria-expanded="open" @click="open = !open">
        <Icon name="lucide:calendar-days" class="h-3.5 w-3.5 shrink-0" />
        <span class="truncate">{{ selected?.name ?? `#${modelValue}` }}</span>
      </button>
      <button type="button" class="inline-flex h-full items-center pl-0.5 pr-2 opacity-80 transition-opacity duration-150 ease-out hover:opacity-100" :aria-label="t('event_picker.clear')" @click="choose(null)">
        <Icon name="lucide:x" class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- 未选：与未选中的类型 chip 同款 -->
    <button
      v-else
      type="button"
      class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150 ease-out"
      :class="idleClass"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon name="lucide:calendar-days" class="h-3.5 w-3.5" />
      {{ label }}
      <Icon name="lucide:chevron-down" class="h-3 w-3 opacity-60" />
    </button>

    <!-- 搜索浮层 -->
    <div v-if="open" class="absolute top-full z-20 mt-2 w-72 rounded-xl bg-popover p-2 shadow-overlay ring-1 ring-line sm:w-80" :class="align === 'start' ? 'left-0' : 'right-0'">
      <div class="relative">
        <Icon name="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
        <input
          ref="input"
          v-model="search"
          type="search"
          maxlength="100"
          :placeholder="t('event_picker.placeholder')"
          :aria-label="t('event_picker.placeholder')"
          class="input input-sm w-full pl-8 text-xs"
        >
      </div>
      <ul v-if="search.trim()" class="mt-1 max-h-64 overflow-y-auto">
        <li v-if="searching" class="px-2.5 py-2 text-xs text-meta">{{ t('event_picker.searching') }}</li>
        <li v-else-if="!results.length" class="px-2.5 py-2 text-xs text-meta">{{ t('event_picker.no_results') }}</li>
        <li v-for="event in results" :key="event.id">
          <button
            type="button"
            class="w-full rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ease-out"
            :class="event.id === modelValue ? 'bg-ghost-hover' : 'hover:bg-ghost-hover'"
            @click="choose(event)"
          >
            <span class="block truncate text-xs font-medium text-body">{{ event.name }}</span>
            <span class="block truncate text-[11px] text-meta">{{ describeEvent(event) }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EventOption } from '~/composables/useEventSearch'

// Event filter styled as a filter-bar chip; the header passes the type chips' classes so both match.
const props = withDefaults(defineProps<{
  modelValue: number | null
  label: string
  activeClass: string
  idleClass: string
  /** Which edge of the chip the search panel lines up with; `start` for a chip at the left of the bar. */
  align?: 'start' | 'end'
}>(), { align: 'end' })

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { t } = useI18n()
const { selected } = useEventLookup(toRef(props, 'modelValue'))
const { search, results, searching } = useEventSearch()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

const choose = (event: EventOption | null) => {
  selected.value = event
  open.value = false
  emit('update:modelValue', event?.id ?? null)
}

// Close on a click outside the chip or on Escape.
const onPointerDown = (e: PointerEvent) => {
  if (!root.value?.contains(e.target as Node)) open.value = false
}
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') open.value = false
}
const stopListening = () => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
}
watch(open, (value) => {
  if (value) {
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeydown)
    nextTick(() => input.value?.focus())
  } else {
    stopListening()
    search.value = ''
  }
})
onBeforeUnmount(stopListening)
</script>
