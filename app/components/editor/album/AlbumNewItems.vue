<template>
  <section v-if="created.length || edited.length" class="rounded-xl border border-success/25 bg-success/10">
    <div class="flex items-center gap-2 border-b border-success/25 px-5 py-3">
      <Sparkles :size="15" class="text-success" />
      <h2 class="text-sm font-bold text-success">{{ $t('editor.new_items.title') }}</h2>
      <span class="text-xs text-meta">{{ $t('editor.new_items.hint') }}</span>
    </div>
    <ul class="divide-y divide-success/25">
      <li v-for="item in created" :key="item.ref" class="space-y-2 px-5 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">{{ enumLabel('catalog_type', item.resource_type) }}</span>
          <input v-model="docOf(item).name" class="input input-sm min-w-48 flex-1" :class="{ 'input-error': errorsOf(item.ref).length }" :placeholder="$t('catalog.field.name')">
          <UiSelect v-if="item.resource_type === 'artist'" v-model="docOf(item).type" :options="artistTypeOptions" :placeholder="$t('editor.entity.artist_type_placeholder')" size="sm" class="w-36" :invalid="!docOf(item).type" :aria-label="$t('catalog.field.type')" />
          <span class="text-[11px] text-meta">{{ usage(item.ref) }}</span>
          <button type="button" class="btn btn-xs ml-auto px-1.5 bg-danger/10 text-danger hover:bg-danger/20" :title="$t('editor.new_items.remove')" @click="remove(item.ref)"><Trash2 :size="12" /></button>
        </div>

        <p v-for="error in errorsOf(item.ref)" :key="error.path" class="text-[11px] text-danger">{{ error.message }}</p>
      </li>
      <li v-for="item in edited" :key="item.ref" class="flex flex-wrap items-center gap-2 px-5 py-2.5 text-sm">
        <span class="rounded-full bg-info/15 px-2 py-0.5 text-[10px] font-bold text-info">{{ $t('editor.new_items.edited', { type: enumLabel('catalog_type', item.resource_type) }) }}</span>
        <EditorRefLabel :id="item.resource_id ?? null" :type="item.resource_type" :references="editor.references" />
        <span class="text-[11px] text-meta">{{ $t('editor.new_items.edited_hint') }}</span>
        <p v-for="error in errorsOf(item.ref)" :key="error.path" class="basis-full text-[11px] text-danger">{{ error.message }}</p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { DraftItem } from '~/composables/useRevisionDraft'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { Sparkles, Trash2 } from '@lucide/vue'

/** Artists and labels created in this revision, and other entities it edits. */
const editor = useAlbumEditor()
const { t } = useI18n()
const { confirm } = useConfirm()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const enums = computed(() => schema.value?.enums ?? {})
const artistTypeOptions = computed<UiSelectOption<string | null>[]>(() => (enums.value.artist_type ?? []).map(value => ({ value, label: enumLabel('artist_type', value) })))

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
