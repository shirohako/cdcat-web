<template>
  <div class="space-y-6">
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-bold text-gray-900">Links</h2>
        <button type="button" class="btn btn-sm btn-primary gap-1" :disabled="loadingProviders" @click="addLink">
          <Plus :size="14" />
          Add Link
        </button>
      </div>
      <p class="text-sm text-gray-500 leading-relaxed">
        添加作品的外部链接（官方网站、流媒体、社交媒体等）。
      </p>
    </div>

    <!-- Loading providers -->
    <div v-if="loadingProviders" class="flex items-center justify-center py-8 text-gray-400 gap-2">
      <span class="loading loading-spinner loading-sm"></span>
      <span class="text-sm">加载链接类型...</span>
    </div>

    <template v-else>
      <!-- 空状态 -->
      <div
        v-if="formData.links.length === 0"
        class="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 gap-2"
      >
        <Link2 :size="32" class="opacity-40" />
        <p class="text-sm">暂无外部链接</p>
      </div>

      <!-- 链接列表 -->
      <div
        v-for="(link, index) in formData.links"
        :key="link.id"
        class="border border-gray-200 rounded-xl p-4"
      >
        <div class="flex items-end gap-3">
          <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Provider -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Platform <span class="text-red-500">*</span></span>
              </label>
              <select v-model="link.link_provider_id" class="select select-bordered select-sm w-full">
                <option value="">-- 选择平台 --</option>
                <optgroup
                  v-for="(group, category) in groupedProviders"
                  :key="category"
                  :label="categoryLabel(category)"
                >
                  <option v-for="provider in group" :key="provider.id" :value="provider.id">
                    {{ formatProviderName(provider.name) }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- URL -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">URL <span class="text-red-500">*</span></span>
              </label>
              <input
                v-model="link.url"
                type="url"
                placeholder="https://..."
                class="input input-bordered input-sm w-full"
              />
            </div>
          </div>

          <button
            type="button"
            class="btn btn-sm btn-ghost text-gray-400 hover:text-error hover:bg-error/10 shrink-0"
            @click="removeLink(index)"
          >
            <Trash2 :size="15" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2, Link2 } from 'lucide-vue-next'

interface LinkProvider {
  id: number
  name: string
  icon_url: string | null
  url_pattern: string | null
  category: string
}

interface LinkEntry {
  id: string
  link_id?: number
  link_provider_id: number | ''
  url: string
}

interface FormData {
  links: LinkEntry[]
  [key: string]: unknown
}

const props = defineProps<{
  formData: FormData
}>()

const emit = defineEmits<{
  'update:formData': [value: FormData]
}>()

// Fetch providers
const { $api } = useNuxtApp()
const providers = ref<LinkProvider[]>([])
const loadingProviders = ref(true)

onMounted(async () => {
  try {
    const data = await $api<LinkProvider[]>('/v1/link-providers')
    providers.value = data ?? []
  } catch {
    providers.value = []
  } finally {
    loadingProviders.value = false
  }
})

// Group providers by category, preserving display_order within each group
const groupedProviders = computed(() => {
  const order = ['official', 'streaming', 'shop', 'social', 'database', 'other']
  const groups: Record<string, LinkProvider[]> = {}
  for (const p of providers.value) {
    const cat = p.category || 'other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(p)
  }
  // Return ordered
  const result: Record<string, LinkProvider[]> = {}
  for (const cat of order) {
    if (groups[cat]?.length) result[cat] = groups[cat]
  }
  for (const cat of Object.keys(groups)) {
    if (!result[cat]) result[cat] = groups[cat]
  }
  return result
})

const categoryLabel = (category: string) => {
  const map: Record<string, string> = {
    official: '官方',
    streaming: '流媒体',
    shop: '购买渠道',
    social: '社交媒体',
    database: '数据库',
    other: '其他',
  }
  return map[category] ?? category
}

const formatProviderName = (name: string) => {
  return name
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

let linkIdCounter = 0

const addLink = () => {
  const newLinks: LinkEntry[] = [
    ...props.formData.links,
    {
      id: `link-${linkIdCounter++}`,
      link_provider_id: '',
      url: '',
    },
  ]
  emit('update:formData', { ...props.formData, links: newLinks })
}

const removeLink = (index: number) => {
  const newLinks = props.formData.links.filter((_, i) => i !== index)
  emit('update:formData', { ...props.formData, links: newLinks })
}
</script>
