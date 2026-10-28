<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { CreditLine, CreditPerson } from '~/utils/creditLines'
import { COMMON_ROLES, addCreditLine, addLinePerson, creditLines, removeCreditLine, removeLinePerson, setLineRoles, setLineTracks, updateLinePerson } from '~/utils/creditLines'
import { newKey } from '~/utils/documentKeys'

/**
 * 按角色: the credits outside the byline block as lines, each a line of the booklet (roles × people × tracks).
 * A line started from the buttons below has no one yet, so it lives here until its first person is added; then it
 * is credits like the others.
 */
const { t } = useI18n()
const editor = useAlbumEditor()
const { roleName, roleOrder } = useCatalogSchema()
const album = computed(() => editor.album.value)

const lines = computed(() => creditLines(album.value, roleOrder))

interface StartedLine { key: string, roles: string[], trackIds: RowId[] }
const started = ref<StartedLine[]>([])
const start = (roles: string[]) => started.value.push({ key: newKey('line'), roles, trackIds: [] })
const drop = (line: StartedLine) => { started.value = started.value.filter(item => item !== line) }
const firstPerson = (line: StartedLine, person: CreditPerson) => {
  addCreditLine(album.value, line.roles, [person], line.trackIds)
  drop(line)
}

const edit = {
  roles: (line: CreditLine, roles: string[]) => setLineRoles(album.value, line, roles),
  tracks: (line: CreditLine, trackIds: RowId[]) => setLineTracks(album.value, line, trackIds),
  add: (line: CreditLine, person: CreditPerson) => addLinePerson(album.value, line, person),
  update: (line: CreditLine, person: CreditPerson, patch: Partial<CreditPerson>) => updateLinePerson(album.value, line, person, patch),
  removePerson: (line: CreditLine, person: CreditPerson) => removeLinePerson(album.value, line, person),
  remove: (line: CreditLine) => removeCreditLine(album.value, line),
}
</script>

<template>
  <div class="space-y-3">
    <ul v-if="lines.length || started.length" class="space-y-1.5">
      <EditorAlbumCreditsLine
        v-for="line in lines"
        :key="line.key"
        :roles="line.roles"
        :track-ids="line.trackIds"
        :people="line.people"
        @roles="edit.roles(line, $event)"
        @tracks="edit.tracks(line, $event)"
        @add-person="edit.add(line, $event)"
        @update-person="(person, patch) => edit.update(line, person, patch)"
        @remove-person="edit.removePerson(line, $event)"
        @remove="edit.remove(line)"
      />
      <EditorAlbumCreditsLine
        v-for="line in started"
        :key="line.key"
        :roles="line.roles"
        :track-ids="line.trackIds"
        :people="[]"
        @roles="line.roles = $event"
        @tracks="line.trackIds = $event"
        @add-person="firstPerson(line, $event)"
        @remove="drop(line)"
      />
    </ul>
    <p v-else class="rounded-lg border border-dashed border-line px-4 py-5 text-center text-sm text-meta">{{ t('editor.credits.none') }}</p>

    <div class="flex flex-wrap items-center gap-1.5">
      <span class="mr-1 text-xs text-meta">{{ t('editor.credits.add_line') }}</span>
      <UiButton
        v-for="role in COMMON_ROLES"
        :key="role"
        variant="add"
        size="xs"
        icon="lucide:plus"
        icon-class="size-3"
        class="gap-1"
        @click="start([role])"
      >{{ roleName(role) }}</UiButton>
      <UiButton size="xs" class="ring-1 ring-inset ring-line" @click="start([])">{{ t('editor.credits.more_roles') }}</UiButton>
    </div>
  </div>
</template>
