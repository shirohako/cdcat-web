<template>
  <div ref="root" class="relative">
    <!-- 已选：与选中的类型 chip 同色，点名称换一个，点 × 清除 -->
    <div v-if="modelValue" class="inline-flex h-8 items-center rounded-lg text-xs font-medium ring-1 ring-inset" :class="activeClass">
      <button type="button" class="inline-flex h-full max-w-56 items-center gap-1.5 pl-3 pr-1.5" :aria-expanded="open" @click="open = !open">
        <Icon name="lucide:calendar-days" class="h-3.5 w-3.5 shrink-0" />
        <span class="truncate">{{ selected?.name ?? `#${modelValue}` }}</span>
      </button>
      <button type="button" class="inline-flex h-full items-center pl-0.5 pr-2 opacity-80 hover:opacity-100" :aria-label="t('event_picker.clear')" @click="choose(null)">
        <Icon name="lucide:x" class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- 未选：与未选中的类型 chip 同款 -->
    <button
      v-else
      type="button"
      class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150"
      :class="idleClass"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon name="lucide:calendar-days" class="h-3.5 w-3.5" />
      {{ label }}
      <Icon name="lucide:chevron-down" class="h-3 w-3 opacity-60" />
    </button>

    <!-- 搜索浮层 -->
    <div v-if="open" class="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:w-80">
      <div class="relative">
        <Icon name="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          ref="input"
          v-model="search"
          type="search"
          maxlength="100"
          :placeholder="t('event_picker.placeholder')"
          :aria-label="t('event_picker.placeholder')"
          class="h-8 w-full rounded-lg border-0 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
      </div>
      <ul v-if="search.trim()" class="mt-1 max-h-64 overflow-y-auto">
        <li v-if="searching" class="px-2.5 py-2 text-xs text-slate-400">{{ t('event_picker.searching') }}</li>
        <li v-else-if="!results.length" class="px-2.5 py-2 text-xs text-slate-400">{{ t('event_picker.no_results') }}</li>
        <li v-for="event in results" :key="event.id">
          <button
            type="button"
            class="w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
            :class="{ 'bg-slate-50': event.id === modelValue }"
            @click="choose(event)"
          >
            <span class="block truncate text-xs font-medium text-slate-700">{{ event.name }}</span>
            <span class="block truncate text-[11px] text-slate-400">{{ describeEvent(event) }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EventOption } from '~/composables/useEventSearch'

// Event filter styled as a filter-bar chip; the header passes the type chips' classes so both match.
const props = defineProps<{
  modelValue: number | null
  label: string
  activeClass: string
  idleClass: string
}>()

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
