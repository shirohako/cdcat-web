<template>
  <section v-if="created.length || edited.length" class="rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
    <div class="flex items-center gap-2 border-b border-emerald-100 px-5 py-3">
      <Sparkles :size="15" class="text-emerald-600" />
      <h2 class="text-sm font-bold text-emerald-900">{{ $t('editor.new_items.title') }}</h2>
      <span class="text-xs text-emerald-700/70">{{ $t('editor.new_items.hint') }}</span>
    </div>
    <ul class="divide-y divide-emerald-100">
      <li v-for="item in created" :key="item.ref" class="space-y-2 px-5 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{{ enumLabel('catalog_type', item.resource_type) }}</span>
          <input v-model="docOf(item).name" class="input input-sm min-w-48 flex-1" :class="{ 'input-error': errorsOf(item.ref).length }" :placeholder="$t('catalog.field.name')">
          <select v-if="item.resource_type === 'artist'" v-model="docOf(item).type" class="select select-sm w-36" :class="{ 'select-error': !docOf(item).type }" :aria-label="$t('catalog.field.type')">
            <option :value="null" disabled>{{ $t('editor.entity.artist_type_placeholder') }}</option>
            <option v-for="value in enums.artist_type ?? []" :key="value" :value="value">{{ enumLabel('artist_type', value) }}</option>
          </select>
          <span class="text-[11px] text-gray-500">{{ usage(item.ref) }}</span>
          <button type="button" class="btn btn-ghost btn-xs ml-auto px-1.5 text-gray-400 hover:text-error" :title="$t('editor.new_items.remove')" @click="remove(item.ref)"><Trash2 :size="12" /></button>
        </div>

        <p v-for="error in errorsOf(item.ref)" :key="error.path" class="text-[11px] text-error">{{ error.message }}</p>
      </li>
      <li v-for="item in edited" :key="item.ref" class="flex flex-wrap items-center gap-2 px-5 py-2.5 text-sm">
        <span class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">{{ $t('editor.new_items.edited', { type: enumLabel('catalog_type', item.resource_type) }) }}</span>
        <EditorRefLabel :id="item.resource_id ?? null" :type="item.resource_type" :references="editor.references" />
        <span class="text-[11px] text-gray-500">{{ $t('editor.new_items.edited_hint') }}</span>
        <p v-for="error in errorsOf(item.ref)" :key="error.path" class="basis-full text-[11px] text-error">{{ error.message }}</p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { DraftItem } from '~/composables/useRevisionDraft'
import { Sparkles, Trash2 } from '@lucide/vue'

/** Artists and labels created in this revision, and other entities it edits. */
const editor = useAlbumEditor()
const { t } = useI18n()
const { confirm } = useConfirm()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const enums = computed(() => schema.value?.enums ?? {})

const others = computed(() => editor.draft.items.value.filter(item => item.ref !== editor.mainRef.value))
const created = computed(() => others.value.filter(item => item.action === 'create'))
const edited = computed(() => others.value.filter(item => item.action === 'update'))

/** The fields this panel edits on new artists and labels. */
interface NewItemDocument {
  name?: string
  type?: string | null
}
const docOf = (item: DraftItem) => item.document as NewItemDocument
const errorsOf = (ref: string) => editor.errors.value.filter(error => error.path.startsWith(`items.${ref}.`) || error.path === `items.${ref}`)

/** Where the album uses the new item, e.g. "2 credits". */
const usage = (ref: string) => {
  const album = editor.album.value
  const target = `@${ref}`
  const credits = album.credits.filter(credit => credit.artist_id === target).length + album.artists.filter(row => row.artist_id === target).length
  if (credits) return t('editor.new_items.used_credits', { count: credits })
  return editor.referenced(target) ? t('editor.new_items.used_elsewhere') : t('editor.new_items.unused')
}

const remove = async (ref: string) => {
  if (editor.referenced(`@${ref}`) && !await confirm({ title: t('editor.new_items.remove_confirm'), confirmText: t('editor.new_items.remove') })) return
  editor.removeItem(ref)
}
</script>
