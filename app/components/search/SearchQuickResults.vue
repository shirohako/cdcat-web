<template>
  <div ref="root">
    <div class="relative">
      <input
        ref="input"
        v-model="query"
        type="search"
        role="combobox"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="active >= 0 ? `${listId}-${active}` : undefined"
        aria-autocomplete="list"
        :placeholder="$t('search.placeholder')"
        maxlength="100"
        class="input w-full pl-10"
        @focus="focused = true"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="submit"
        @keydown.esc.prevent="dismiss"
      >
      <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
    </div>

    <div
      v-if="open"
      :id="listId"
      role="listbox"
      class="-mx-3 -mb-3 mt-3 max-h-[60vh] overflow-y-auto border-t border-line py-1"
    >
      <p v-if="!searchable(query.trim())" class="px-4 py-3 text-sm text-meta">{{ $t('search.too_short') }}</p>
      <p v-else-if="loading && !groups.length" class="px-4 py-3 text-sm text-meta">{{ $t('search.searching') }}</p>
      <p v-else-if="failed" class="px-4 py-3 text-sm text-danger">{{ $t('errors.request_failed') }}</p>
      <p v-else-if="!groups.length" class="px-4 py-3 text-sm text-meta">{{ $t('search.no_results') }}</p>
      <template v-for="group in groups" :key="group.type">
        <p class="flex items-center justify-between px-3 pb-1 pt-2 text-xs font-semibold text-faint">
          <span>{{ $t(`search.types.${group.type}`) }}</span>
          <NuxtLink v-if="group.total > group.items.length" :to="{ path: '/search', query: { q: query.trim(), type: group.type } }" class="font-normal transition-colors hover:text-primary" @click="close()">
            {{ $t('search.more', { count: group.total_is_capped ? $t('search.capped', { count: group.total }) : group.total }) }}
          </NuxtLink>
        </p>
        <SearchResultItem
          v-for="item in group.items"
          :id="`${listId}-${indexOf(item)}`"
          :key="`${item.type}:${item.id}`"
          role="option"
          :aria-selected="indexOf(item) === active"
          :result="item"
          compact
          :class="indexOf(item) === active ? 'bg-ghost-hover' : 'hover:bg-ghost-hover'"
          @click="close()"
          @mouseenter="active = indexOf(item)"
        />
      </template>
      <NuxtLink v-if="searchable(query.trim())" :to="{ path: '/search', query: { q: query.trim() } }" class="mt-1 block border-t border-line px-4 py-2 text-center text-sm font-semibold text-primary transition-colors duration-150 ease-out hover:bg-ghost-hover" @click="close()">
        {{ $t('search.view_all') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// The navbar search box (inside the navbar's search popup): a few results per type while typing
// (docs/api/search.md), listed below the input. ↑↓ pick a result, Enter opens it or the full results,
// Esc dismisses the popup.
import type { SearchResult } from '~/types/search'
import { Search } from '@lucide/vue'

const props = defineProps<{ autofocus?: boolean }>()
const emit = defineEmits<{ dismiss: [] }>()

const { query, groups, loading, failed } = useQuickSearch(3)
const router = useRouter()
const route = useRoute()
const listId = useId()
const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const focused = ref(false)
const active = ref(-1)

const open = computed(() => focused.value && query.value.trim() !== '')
const flat = computed(() => groups.value.flatMap(group => group.items))
const indexOf = (item: SearchResult) => flat.value.indexOf(item)
watch(groups, () => { active.value = -1 })

const move = (step: number) => {
  focused.value = true
  const count = flat.value.length
  if (!count) return
  // Cycles through the results and back to the input (-1).
  active.value = (active.value + 1 + step + count + 1) % (count + 1) - 1
}
const close = (blur = false) => {
  focused.value = false
  active.value = -1
  if (blur) input.value?.blur()
}
const submit = () => {
  const item = flat.value[active.value]
  const text = query.value.trim()
  if (item) router.push(searchResultPath(item))
  else if (searchable(text)) router.push({ path: '/search', query: { q: text } })
  else return
  close(true)
}

// Leaving the search page or opening a result clears the box; the results page has its own input.
watch(() => route.fullPath, () => close())

const dismiss = () => {
  close(true)
  emit('dismiss')
}

const onPointer = (event: PointerEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) close()
}
onMounted(() => {
  document.addEventListener('pointerdown', onPointer)
  if (props.autofocus) input.value?.focus()
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointer)
})
</script>
