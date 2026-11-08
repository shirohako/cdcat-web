<script setup lang="ts">
import type { AlbumCreditRow } from '~/utils/albumDocument'
import type { CreditPerson } from '~/utils/creditLines'
import { canHaveRoleLabel } from '~/utils/albumDocument'
import { ARTIST_ROLE, FEATURING_ROLE, parentCandidates, parentOf } from '~/utils/artistLine'
import { personOf } from '~/utils/creditLines'

/**
 * One role on a track (or on the whole album) in the by-track view and the byline block: its name, a tag per
 * person, and a search to add another. `roles` makes it a row being started, with the role still to pick; then the
 * search opens as soon as there is one, and it can be dropped (`cancel`). Otherwise, when `changeable`, a click on the role's name changes it for the
 * whole row (not to the roles in `exclude`), which joins the row of that role if the track has one. Each tag is one
 * credit row. Given the track's credits (`trackRows`), a 客串's tag also picks the credit it belongs to (utils/artistLine),
 * the default the one before it; only 客串 show that anywhere, so no other role offers it. The artists of a track also have an order to change and a word to join them by. A row with
 * people can be emptied at once from the bin right after the role, shown on hovering the row (always on touch), after a
 * question (`remove` for each).
 */
const props = defineProps<{ role?: string, rows?: AlbumCreditRow[], roles?: string[], trackRows?: AlbumCreditRow[], changeable?: boolean, exclude?: readonly string[] }>()
const emit = defineEmits<{
  'add': [person: CreditPerson]
  'role': [role: string]
  'update': [row: AlbumCreditRow, patch: Partial<CreditPerson>]
  'remove': [row: AlbumCreditRow]
  'update:roles': [roles: string[]]
  'cancel': []
  'parent': [row: AlbumCreditRow, parent: AlbumCreditRow | null]
  'move': [row: AlbumCreditRow, delta: number]
}>()

const { t } = useI18n()
const editor = useAlbumEditor()
const people = useCreditPeople()
const { confirm } = useConfirm()
const { roleName, roleNameEn } = useCatalogSchema()

const parentOfRow = (row: AlbumCreditRow) => {
  const rows = props.trackRows
  if (!rows || row.role !== FEATURING_ROLE) return undefined
  const candidates = parentCandidates(row, rows)
  if (!candidates.length || (candidates.length < 2 && row.parent_id == null)) return undefined
  const current = parentOf(row, rows)
  const label = (credit: AlbumCreditRow) => `${people.nameOf(personOf(credit)) || '—'} · ${roleName(credit.role)}`
  return {
    value: current ? String(current.id) : '',
    options: candidates.map(credit => ({ value: String(credit.id), label: label(credit) })),
    label: current && candidates.length > 1 ? people.nameOf(personOf(current)) : null,
  }
}
const setParent = (row: AlbumCreditRow, value: string) => emit('parent', row, props.trackRows?.find(other => String(other.id) === value) ?? null)
const starting = computed(() => props.roles !== undefined)
/** A track's artists: printed in order, so they can be moved and joined by a word (utils/artistLine). */
const ordered = computed(() => !!props.trackRows && props.role === ARTIST_ROLE)
const placeOf = (index: number) => {
  const rows = props.rows ?? []
  if (!ordered.value) return {}
  return {
    joinAfter: index ? people.nameOf(personOf(rows[index - 1]!)) || '—' : undefined,
    movable: rows.length > 1 ? { earlier: index > 0, later: index < rows.length - 1 } : undefined,
  }
}
const invalid = (row: AlbumCreditRow) => editor.errorsIn(`credits.${row.id}`).length > 0
const errors = computed(() => (props.rows ?? []).flatMap(row => editor.errorsIn(`credits.${row.id}`)))
const removeAll = async () => {
  const rows = [...props.rows ?? []]
  if (await confirm({ title: t('editor.credits.remove_role_confirm_title'), description: t('editor.credits.remove_role_confirm_desc', { role: roleName(props.role!), count: rows.length }) })) {
    for (const row of rows) emit('remove', row)
  }
}
</script>

<template>
  <div class="group/row flex flex-wrap items-center gap-x-3 gap-y-1.5">
    <EditorAlbumCreditsRoles v-if="starting" :model-value="roles!" :exclude="exclude" starting class="shrink-0" @update:model-value="emit('update:roles', $event)" />
    <div v-else class="flex w-24 shrink-0 items-center gap-1 sm:w-28">
      <EditorAlbumCreditsRoles v-if="changeable" single :model-value="[role!]" :exclude="exclude" @update:model-value="emit('role', $event[0]!)">
        <template #trigger="{ toggle, attrs }">
          <button
            type="button"
            v-bind="attrs"
            class="group flex min-w-0 flex-col rounded-md text-left text-xs"
            :title="t('editor.credits.change_role')"
            @click="toggle"
          >
            <span class="flex max-w-full items-center gap-1 font-medium text-primary">
              <span class="truncate group-hover:underline">{{ roleName(role!) }}</span>
              <Icon name="lucide:chevron-down" class="size-3 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100" />
            </span>
            <span v-if="roleNameEn(role!)" class="truncate text-11 text-meta">{{ roleNameEn(role!) }}</span>
          </button>
        </template>
      </EditorAlbumCreditsRoles>
      <span v-else class="flex min-w-0 flex-col text-xs">
        <span class="truncate font-medium text-primary">{{ roleName(role!) }}</span>
        <span v-if="roleNameEn(role!)" class="truncate text-11 text-meta">{{ roleNameEn(role!) }}</span>
      </span>
      <UiButton v-if="rows?.length" variant="danger-soft" icon="lucide:trash-2" icon-class="size-3" :label="t('editor.credits.remove_role')" size="xs" class="ml-1 min-h-6! w-6! shrink-0 opacity-0 transition-[opacity,color,background-color] group-hover/row:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100" @click="removeAll" />
    </div>
    <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <EditorAlbumCreditsPerson
        v-for="(row, index) in rows ?? []"
        :key="String(row.id)"
        :person="personOf(row)"
        :invalid="invalid(row)"
        :labelable="canHaveRoleLabel(row.role)"
        :parent="parentOfRow(row)"
        :join-phrase="row.join_phrase"
        v-bind="placeOf(index)"
        @move="emit('move', row, $event)"
        @update="emit('update', row, $event)"
        @remove="emit('remove', row)"
        @parent="setParent(row, $event)"
      />
      <EditorAlbumCreditsAddPerson v-if="!starting || roles!.length" :start-open="starting" @add="emit('add', $event)" />
    </span>
    <UiButton v-if="starting" variant="danger-soft" icon="lucide:trash-2" :label="t('editor.credits.remove_line')" size="xs" class="shrink-0 ring-1 ring-inset ring-danger/20" @click="emit('cancel')" />
    <p v-for="error in errors" :key="error.path" class="w-full text-11 text-danger">{{ error.message }}</p>
  </div>
</template>
