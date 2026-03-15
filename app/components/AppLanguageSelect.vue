<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger -->
    <div
      class="flex items-center gap-2 w-full rounded-lg border bg-white px-3 py-2 text-sm cursor-text transition-colors focus-within:ring-2 focus-within:ring-sky-400 focus-within:border-transparent"
      :class="isOpen ? 'border-sky-400 ring-2 ring-sky-400' : 'border-gray-200'"
      @click="openDropdown"
    >
      <!-- Selected badge (hidden while typing) -->
      <span
        v-if="selectedOption && !query"
        class="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-gray-100 text-gray-500"
      >{{ selectedOption.code }}</span>

      <input
        ref="inputRef"
        v-model="query"
        :placeholder="selectedOption ? selectedOption.name : '请选择或输入语言代码…'"
        class="flex-1 min-w-0 outline-none bg-transparent text-gray-800 placeholder-gray-400"
        @focus="openDropdown"
        @keydown.escape.prevent="close"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.arrow-down.prevent="moveDown"
        @keydown.arrow-up.prevent="moveUp"
      />
      <button
        v-if="modelValue"
        type="button"
        class="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
        @click.stop="clear"
      >
        <X :size="13" />
      </button>
      <ChevronDown
        :size="14"
        class="shrink-0 text-gray-400 transition-transform duration-150"
        :class="{ 'rotate-180': isOpen }"
      />
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute z-20 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden"
      >
        <div class="max-h-56 overflow-y-auto" ref="listRef">
          <!-- Allow custom code entry -->
          <button
            v-if="query && !exactMatch"
            type="button"
            class="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-sky-50 border-b border-gray-100"
            :class="{ 'bg-sky-50': highlightedIndex === -1 }"
            @click="selectCustom"
          >
            <span class="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded shrink-0">{{ query }}</span>
            <span class="text-gray-400 text-xs">使用自定义代码</span>
          </button>

          <div v-if="!filteredOptions.length && !query" class="px-3 py-4 text-center text-xs text-gray-400">
            输入关键词搜索
          </div>
          <div v-else-if="!filteredOptions.length && query && exactMatch" class="px-3 py-2 text-xs text-gray-400 text-center">
            无更多匹配项
          </div>

          <button
            v-for="(opt, idx) in filteredOptions"
            :key="opt.code"
            type="button"
            class="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors"
            :class="idx === highlightedIndex ? 'bg-sky-50' : 'hover:bg-gray-50'"
            @click="select(opt)"
          >
            <span class="font-mono text-[11px] font-bold text-gray-400 w-20 shrink-0">{{ opt.code }}</span>
            <span class="text-gray-700 truncate">{{ opt.name }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { X, ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ── Language list ──────────────────────────────────────────────────────────
// Special entries that Intl.DisplayNames handles poorly or needs overrides
const SPECIAL: Record<string, string> = {
  'ja-Latn': 'Romaji（日文罗马字）',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  'zh-HK':   '粤语（香港）',
  'zh-TW':   '繁體中文（台灣）',
  'pt-BR':   '葡萄牙语（巴西）',
  'pt-PT':   '葡萄牙语（葡萄牙）',
  'es-419':  '西班牙语（拉美）',
  'sr-Latn': '塞尔维亚语（拉丁）',
}

const ISO_CODES = [
  'ja', 'ko', 'zh', 'en', 'fr', 'de', 'es', 'it', 'pt', 'ru',
  'ar', 'hi', 'bn', 'pa', 'ur', 'fa', 'he',
  'th', 'vi', 'id', 'ms', 'my', 'km', 'lo', 'tl',
  'nl', 'pl', 'sv', 'da', 'fi', 'no', 'nb', 'nn',
  'tr', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sr',
  'uk', 'be', 'lt', 'lv', 'et', 'el',
  'ca', 'eu', 'gl', 'cy', 'ga',
  'ta', 'te', 'ml', 'kn', 'si',
  'mn', 'ka', 'hy', 'az', 'kk', 'uz', 'tg', 'ky',
  'sw', 'am', 'so', 'yo', 'ig', 'zu', 'af',
  'is', 'mt', 'sq', 'mk', 'bs', 'sl',
  'lv', 'lt',
]

interface LangOption {
  code: string
  name: string
}

const buildOptions = (): LangOption[] => {
  const displayNames = new Intl.DisplayNames(['zh-Hans'], { type: 'language' })

  const special = Object.entries(SPECIAL).map(([code, name]) => ({ code, name }))

  const iso = ISO_CODES.map(code => {
    let name: string
    try { name = displayNames.of(code) ?? code }
    catch { name = code }
    return { code, name }
  })

  // Deduplicate by code, special entries take priority
  const seen = new Set(special.map(o => o.code))
  const deduped = iso.filter(o => !seen.has(o.code))

  return [...special, ...deduped]
}

const allOptions = buildOptions()

// ── State ──────────────────────────────────────────────────────────────────
const isOpen = ref(false)
const query = ref('')
const highlightedIndex = ref(0)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const selectedOption = computed(() =>
  allOptions.find(o => o.code === props.modelValue) ??
  (props.modelValue ? { code: props.modelValue, name: props.modelValue } : null)
)

const filteredOptions = computed(() => {
  if (!query.value) return allOptions
  const q = query.value.toLowerCase()
  return allOptions.filter(o =>
    o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)
  )
})

const exactMatch = computed(() =>
  allOptions.some(o => o.code.toLowerCase() === query.value.toLowerCase())
)

// ── Actions ────────────────────────────────────────────────────────────────
const openDropdown = () => {
  isOpen.value = true
  query.value = ''
  highlightedIndex.value = 0
  nextTick(() => inputRef.value?.focus())
}

const close = () => {
  isOpen.value = false
  query.value = ''
  highlightedIndex.value = 0
}

const select = (opt: LangOption) => {
  emit('update:modelValue', opt.code)
  close()
}

const selectCustom = () => {
  if (query.value) {
    emit('update:modelValue', query.value)
    close()
  }
}

const clear = () => {
  emit('update:modelValue', '')
  close()
}

const selectHighlighted = () => {
  if (highlightedIndex.value === -1) {
    selectCustom()
  } else {
    const opt = filteredOptions.value[highlightedIndex.value]
    if (opt) select(opt)
  }
}

const moveDown = () => {
  const max = filteredOptions.value.length - 1
  highlightedIndex.value = highlightedIndex.value < max ? highlightedIndex.value + 1 : max
  scrollHighlightedIntoView()
}

const moveUp = () => {
  highlightedIndex.value = highlightedIndex.value > 0 ? highlightedIndex.value - 1 : 0
  scrollHighlightedIntoView()
}

const scrollHighlightedIntoView = () => {
  nextTick(() => {
    const el = listRef.value?.children[highlightedIndex.value] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  })
}

// Reset highlighted index when filter changes
watch(query, () => { highlightedIndex.value = 0 })

// Click outside to close
onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})

const handleOutsideClick = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    close()
  }
}
</script>
