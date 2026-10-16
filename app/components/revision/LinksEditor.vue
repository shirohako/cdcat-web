<script setup lang="ts">
import { Link2, Plus, Trash2 } from '@lucide/vue'

export interface EditableLink {
  id?: number
  link_provider_id: number | ''
  url: string
  meta?: Record<string, unknown> | null
}

interface LinkProvider {
  id: number
  name: string
  category: string
}

// External links for entries and series; rows keep their id so the backend updates instead of recreating them.
const links = defineModel<EditableLink[]>({ required: true })

const { $api } = useNuxtApp()
const { t, te } = useI18n()
const providers = ref<LinkProvider[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await $api<LinkProvider[]>('/v1/link-providers')
    providers.value = Array.isArray(data) ? data : []
  } catch {
    providers.value = []
  } finally {
    loading.value = false
  }
})

const CATEGORY_ORDER = ['official', 'database', 'shop', 'streaming', 'social', 'other']
const groupedProviders = computed(() => {
  const groups = new Map<string, LinkProvider[]>()
  for (const provider of providers.value) {
    const category = provider.category || 'other'
    groups.set(category, [...(groups.get(category) || []), provider])
  }
  return [...groups.entries()].sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a)
    const bi = CATEGORY_ORDER.indexOf(b)
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
  })
})

const categoryLabel = (category: string) => te(`catalog.link_category.${category}`) ? t(`catalog.link_category.${category}`) : category
const providerLabel = (name: string) => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

const add = () => {
  links.value = [...links.value, { link_provider_id: '', url: '' }]
}

const remove = (index: number) => {
  links.value = links.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-gray-500">{{ $t('catalog.form.links_hint') }}</p>
      <button type="button" class="btn btn-sm btn-outline shrink-0" :disabled="loading" @click="add">
        <Plus class="h-4 w-4" />
        {{ $t('catalog.form.add_link') }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-sm" />
    </div>
    <div v-else-if="!links.length" class="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-10 text-gray-400">
      <Link2 class="h-8 w-8 opacity-40" />
    </div>
    <div
      v-for="(link, index) in links"
      v-else
      :key="link.id ?? `new-${index}`"
      class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-[12rem_1fr_auto] md:items-center"
    >
      <select v-model="link.link_provider_id" class="select select-bordered select-sm w-full" :aria-label="$t('catalog.form.provider')">
        <option value="" disabled>{{ $t('catalog.form.provider_placeholder') }}</option>
        <optgroup v-for="[category, items] in groupedProviders" :key="category" :label="categoryLabel(category)">
          <option v-for="provider in items" :key="provider.id" :value="provider.id">{{ providerLabel(provider.name) }}</option>
        </optgroup>
      </select>
      <input v-model="link.url" type="url" class="input input-bordered input-sm w-full" placeholder="https://" :aria-label="$t('catalog.form.url')" >
      <button type="button" class="btn btn-ghost btn-sm text-gray-400 hover:text-error" :aria-label="$t('catalog.form.remove')" @click="remove(index)">
        <Trash2 class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
