<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { CreditPerson } from '~/utils/creditLines'

/**
 * One person of a credit, as a tag: the name with what to look at beside it (新建, 选类型 for a new artist without
 * a type, 仅署名 for a printed name only, the harvest page's notes), and a remove button. A click opens the rest:
 * the printed name and the detail (applied when the card closes, since they decide which line the person is in), a
 * new artist's type, and linking the person to an artist or keeping only the printed name.
 */
const props = defineProps<{ person: CreditPerson, invalid?: boolean }>()
const emit = defineEmits<{ update: [patch: Partial<CreditPerson>], remove: [] }>()

const { t } = useI18n()
const people = useCreditPeople()

const open = ref(false)
const form = reactive({ credited_as: '', detail: '' })
const name = computed(() => people.nameOf(props.person))
const isNew = computed(() => people.isNew(props.person))
const type = computed({
  get: () => people.newType(props.person),
  set: value => people.setNewType(props.person, value),
})
const note = computed(() => people.noteOf(props.person))

/** What the card's fields change. A printed name is all a name-only credit has, so it can't be emptied here. */
const formPatch = (): Partial<CreditPerson> => {
  const patch: Partial<CreditPerson> = {}
  const printed = form.credited_as.trim() || (props.person.artist_id === null ? props.person.credited_as : null)
  if (printed !== props.person.credited_as) patch.credited_as = printed
  if ((form.detail.trim() || null) !== props.person.detail) patch.detail = form.detail.trim() || null
  return patch
}

/** Closing the card applies the fields; linking and unlinking apply them themselves. */
let applied = false
watch(open, (opened) => {
  if (opened) {
    form.credited_as = props.person.credited_as ?? ''
    form.detail = props.person.detail ?? ''
    applied = false
    return
  }
  const patch = formPatch()
  if (!applied && Object.keys(patch).length) emit('update', patch)
})

const finish = (patch: Partial<CreditPerson>) => {
  applied = true
  emit('update', { ...formPatch(), ...patch })
  open.value = false
}
/** The printed name stays only where it differs from the artist's. */
const link = (item: PickedEntity) => {
  const printed = form.credited_as.trim() || props.person.credited_as
  finish({ artist_id: people.picked(item).artist_id, credited_as: printed && printed !== item.label ? printed : null })
}
/** Keeps the name as printed when the artist goes. */
const unlink = () => finish({ artist_id: null, credited_as: form.credited_as.trim() || name.value })
</script>

<template>
  <UiPopover v-model:open="open" placement="bottom-start" :label="name" class="w-76 p-3!">
    <template #trigger="{ toggle, attrs }">
      <span
        class="inline-flex h-7 max-w-full items-center rounded-md text-xs transition-colors"
        :class="[
          person.artist_id === null ? 'border border-dashed border-field-line bg-transparent' : isNew ? 'bg-success/12' : 'bg-btn',
          invalid ? 'ring-2 ring-danger/40' : '',
        ]"
      >
        <button type="button" class="flex h-full min-w-0 items-center gap-1.5 rounded-l-md pl-2 pr-1 text-left hover:bg-btn-hover/60" v-bind="attrs" @click="toggle">
          <span class="truncate font-medium text-title">{{ name || '—' }}</span>
          <span v-if="person.artist_id !== null && person.credited_as" class="truncate text-[11px] text-meta">{{ t('editor.credits.printed_as', { name: person.credited_as }) }}</span>
          <span v-if="person.detail" class="truncate text-[11px] text-meta">· {{ person.detail }}</span>
          <span v-if="isNew && !type" class="shrink-0 rounded-sm bg-warning/15 px-1 text-[10px] font-bold text-warning">{{ t('editor.credits.pick_type') }}</span>
          <span v-else-if="isNew" class="shrink-0 rounded-sm bg-success/15 px-1 text-[10px] font-bold text-success">{{ t('editor.new') }}</span>
          <span v-else-if="person.artist_id === null" class="shrink-0 text-[10px] text-meta">{{ t('editor.dialog.name_only') }}</span>
          <span v-if="note" class="shrink-0 rounded-sm bg-warning/15 px-1 text-[10px] font-bold text-warning" :title="note">⚠</span>
        </button>
        <button type="button" class="mr-0.5 grid size-5 shrink-0 place-items-center rounded text-meta hover:bg-danger/15 hover:text-danger" :aria-label="t('editor.credits.remove_person', { name })" @click="emit('remove')">
          <Icon name="lucide:x" class="size-3" />
        </button>
      </span>
    </template>

    <div class="space-y-3">
      <div v-if="person.artist_id !== null" class="flex items-center gap-2">
        <Icon name="lucide:user" class="size-4 shrink-0 text-meta" />
        <span class="min-w-0 flex-1 truncate text-sm font-semibold text-title">{{ name }}</span>
        <EditorViewLink v-if="typeof person.artist_id === 'number'" :id="person.artist_id" type="artist" />
      </div>
      <EditorArtistTypePicker v-if="isNew" v-model="type" :invalid="!type" />
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-body">{{ t('editor.dialog.credited_as') }}</span>
        <input v-model="form.credited_as" class="input input-sm w-full" maxlength="200" :placeholder="person.artist_id === null ? '' : t('editor.credits.printed_hint')" @keydown.enter.prevent="open = false">
      </label>
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-body">{{ t('catalog.field.detail') }}</span>
        <input v-model="form.detail" class="input input-sm w-full" maxlength="100" :placeholder="t('editor.credits.detail_hint')" @keydown.enter.prevent="open = false">
      </label>
      <div v-if="person.artist_id === null">
        <span class="mb-1 block text-xs font-medium text-body">{{ t('editor.credits.link_artist') }}</span>
        <EditorEntityPicker kind="artist" :placeholder="t('editor.credits.pick_artist')" @select="link" />
      </div>
      <p v-if="note" class="rounded-md bg-warning/10 px-2.5 py-1.5 text-xs text-warning">⚠ {{ note }}</p>
      <div class="flex flex-wrap justify-between gap-2 border-t border-line pt-3">
        <UiButton v-if="person.artist_id !== null" size="xs" class="ring-1 ring-inset ring-line" @click="unlink">{{ t('editor.credits.unlink_artist') }}</UiButton>
        <UiButton variant="danger-soft" size="xs" class="ml-auto ring-1 ring-inset ring-danger/20" @click="emit('remove')">{{ t('common.delete') }}</UiButton>
      </div>
    </div>
  </UiPopover>
</template>
