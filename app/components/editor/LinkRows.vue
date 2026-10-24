<template>
  <div class="space-y-2">
    <ul v-if="shown.length" class="space-y-1.5">
      <EditorListRow v-for="row in shown" :key="row.id" :invalid="!row.url" @edit="edit(row)" @remove="remove(row)">
        <span class="max-w-36 shrink-0 truncate rounded-md bg-btn px-1.5 py-0.5 text-[11px] font-medium text-btn-content">{{ providerOf(row.link_provider_id) }}</span>
        <span class="min-w-0 truncate text-sm text-body">{{ bare(row.url) || '—' }}</span>
        <template #actions>
          <a v-if="row.url" :href="row.url" target="_blank" rel="noopener noreferrer" class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-meta transition-colors hover:bg-ghost-hover hover:text-primary" :aria-label="$t('editor.dialog.open_link')">
            <ExternalLink :size="14" />
          </a>
        </template>
      </EditorListRow>
    </ul>
    <EditorAddButton @click="edit(null)">{{ $t('editor.add_link') }}</EditorAddButton>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.link_edit' : 'editor.add_link')" :description="$t('editor.dialog.link_hint')" :icon="Link2" @submit="save">
      <div class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">URL</span>
          <input
            v-model.trim="form.url"
            data-autofocus
            type="url"
            inputmode="url"
            class="input w-full"
            :class="{ 'input-error': problem }"
            placeholder="https://"
            @input="autoDetect"
          >
          <span v-if="problem" class="mt-1 block text-xs text-danger">{{ problem }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.link_provider_id') }}</span>
          <UiSelect v-model="form.provider" :options="providerOptions" placeholder="—" size="sm" class="w-full" @change="pickedByHand = true" />
          <span class="mt-1 block text-[11px] text-meta">{{ $t('editor.dialog.link_provider_hint') }}</span>
        </label>
      </div>
      <template #footer>
        <button type="button" class="btn btn-ghost btn-sm" @click="dialog = false">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary btn-sm">{{ $t(editing ? 'common.save' : 'common.add') }}</button>
      </template>
    </EditorModal>
  </div>
</template>

<script setup lang="ts">
import type { LinkRow } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ExternalLink, Link2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, nextOrder } from '~/utils/documentRows'

/** External links of an album, artist, label, entry or series, added and edited in a dialog. */
const rows = defineModel<LinkRow[]>({ required: true })
const { t } = useI18n()
const { schema } = useCatalogSchema()
const providers = computed(() => schema.value?.link_providers ?? [])
const providerName = (name: string) => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
const providerOptions = computed<UiSelectOption<number | null>[]>(() => providers.value.map(provider => ({ value: provider.id, label: providerName(provider.name) })))
const providerOf = (id: number | null) => {
  const provider = providers.value.find(item => item.id === id)
  return provider ? providerName(provider.name) : '—'
}
const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')

const shown = computed(() => byOrder(rows.value))

const remove = (row: LinkRow) => {
  const index = rows.value.indexOf(row)
  if (index >= 0) rows.value.splice(index, 1)
}

/** The provider whose URL pattern matches, e.g. https://vgmdb.net/*, else "other". */
const detect = (url: string) => {
  const match = providers.value.find((provider) => {
    if (!provider.url_pattern) return false
    const pattern = new RegExp(`^${provider.url_pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}`, 'i')
    return pattern.test(url) || pattern.test(url.replace(/^http:/, 'https:'))
  })
  return match?.id ?? providers.value.find(provider => provider.name === 'other')?.id ?? null
}

// ---- the dialog ----

const dialog = ref(false)
const editing = ref<LinkRow | null>(null)
const form = reactive({ url: '', provider: null as number | null })
const pickedByHand = ref(false)
const tried = ref(false)

const edit = (row: LinkRow | null) => {
  editing.value = row
  form.url = row?.url ?? ''
  form.provider = row?.link_provider_id ?? null
  pickedByHand.value = !!row?.link_provider_id
  tried.value = false
  dialog.value = true
}

/** Follows the URL until a provider is chosen by hand. */
const autoDetect = () => {
  if (!pickedByHand.value) form.provider = form.url ? detect(form.url) : null
}

const valid = (url: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}
const same = (a: string, b: string) => bare(a).toLowerCase() === bare(b).toLowerCase()
const problem = computed(() => {
  if (!tried.value) return null
  if (!valid(form.url)) return t('editor.dialog.link_invalid')
  if (shown.value.some(row => row !== editing.value && same(row.url, form.url))) return t('editor.dialog.link_duplicate')
  return null
})

const save = () => {
  tried.value = true
  if (problem.value) return
  const provider = form.provider ?? detect(form.url)
  if (editing.value) {
    editing.value.url = form.url
    editing.value.link_provider_id = provider
  } else {
    rows.value.push({ id: newKey('l'), link_provider_id: provider, url: form.url, sort_order: nextOrder(shown.value) })
  }
  dialog.value = false
}
</script>
