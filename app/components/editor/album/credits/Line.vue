<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { CreditLinePerson, CreditPerson } from '~/utils/creditLines'
import { personKey } from '~/utils/creditLines'

/**
 * One line of the by-role view, the way a booklet prints it: its roles, its people and the tracks they are on (none:
 * the whole album). A line with no one yet (just started) opens its search at once. The view does the editing.
 */
const props = defineProps<{ roles: string[], trackIds: RowId[], people: CreditLinePerson[] }>()
const emit = defineEmits<{
  'roles': [roles: string[]]
  'tracks': [trackIds: RowId[]]
  'add-person': [person: CreditPerson]
  'update-person': [person: CreditPerson, patch: Partial<CreditPerson>]
  'remove-person': [person: CreditPerson]
  'remove': []
}>()

const { t } = useI18n()
const editor = useAlbumEditor()
const errorsOf = (entry: CreditLinePerson) => entry.rows.flatMap(row => editor.errorsIn(`credits.${row.id}`))
const errors = computed(() => [...new Map(props.people.flatMap(errorsOf).map(error => [error.message, error])).values()])
</script>

<template>
  <li class="rounded-lg px-2.5 py-2" :class="errors.length ? 'bg-danger/8 ring-1 ring-inset ring-danger/25' : 'bg-sunken'">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <EditorAlbumCreditsRoles :model-value="roles" class="shrink-0" @update:model-value="emit('roles', $event)" />
      <div class="flex min-w-0 flex-1 basis-48 flex-wrap items-center gap-1.5">
        <EditorAlbumCreditsPerson
          v-for="entry in people"
          :key="personKey(entry.person)"
          :person="entry.person"
          :invalid="errorsOf(entry).length > 0"
          @update="emit('update-person', entry.person, $event)"
          @remove="emit('remove-person', entry.person)"
        />
        <EditorAlbumCreditsAddPerson v-if="roles.length" :start-open="!people.length" @add="emit('add-person', $event)" />
      </div>
      <EditorAlbumCreditsTracks :model-value="trackIds" class="ml-auto" @update:model-value="emit('tracks', $event)" />
      <button
        type="button"
        class="grid size-7 shrink-0 place-items-center rounded-md bg-danger/10 text-danger ring-1 ring-inset ring-danger/20 transition-colors hover:bg-danger/20"
        :aria-label="t('editor.credits.remove_line')"
        :title="t('editor.credits.remove_line')"
        @click="emit('remove')"
      >
        <Icon name="lucide:trash-2" class="size-3.5" />
      </button>
    </div>
    <p v-for="error in errors" :key="error.path" class="mt-1.5 text-[11px] text-danger">{{ error.message }}</p>
  </li>
</template>
