<script setup lang="ts">
import type { AlbumCreditRow } from '~/utils/albumDocument'
import type { CreditPerson } from '~/utils/creditLines'
import { canHaveRoleLabel } from '~/utils/albumDocument'
import { FEATURING_ROLE, parentCandidates, parentOf } from '~/utils/artistLine'
import { personOf } from '~/utils/creditLines'

/**
 * One role on a track (or on the whole album) in the by-track view and the byline block: its name, a tag per
 * person, and a search to add another. `roles` makes it a row being started, with the role still to pick; then the
 * search opens as soon as there is one, and it can be dropped (`cancel`). Otherwise, when `changeable`, a click on the role's name changes it for the
 * whole row (not to the roles in `exclude`), which joins the row of that role if the track has one. Each tag is one
 * credit row. Given the track's credits (`trackRows`), each tag also picks the credit it belongs to (utils/artistLine):
 * a 客串 always one of them, the default the one before it; another role one or none. A credit others belong to
 * belongs to none itself.
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
}>()

const { t } = useI18n()
const editor = useAlbumEditor()
const people = useCreditPeople()
const { roleName, roleNameEn } = useCatalogSchema()

const parentOfRow = (row: AlbumCreditRow) => {
  const rows = props.trackRows
  if (!rows) return undefined
  const candidates = parentCandidates(row, rows)
  const featuring = row.role === FEATURING_ROLE
  const hasOwn = rows.some(other => other !== row && parentOf(other, rows) === row)
  if (!candidates.length || hasOwn || (featuring && candidates.length < 2 && row.parent_id == null)) return undefined
  const current = parentOf(row, rows)
  const label = (credit: AlbumCreditRow) => `${people.nameOf(personOf(credit)) || '—'} · ${roleName(credit.role)}`
  return {
    value: current ? String(current.id) : '',
    options: [...(featuring ? [] : [{ value: '', label: t('editor.credits.parent_none') }]), ...candidates.map(credit => ({ value: String(credit.id), label: label(credit) }))],
    label: current && (candidates.length > 1 || !featuring) ? people.nameOf(personOf(current)) : null,
  }
}
const setParent = (row: AlbumCreditRow, value: string) => emit('parent', row, props.trackRows?.find(other => String(other.id) === value) ?? null)
const starting = computed(() => props.roles !== undefined)
const invalid = (row: AlbumCreditRow) => editor.errorsIn(`credits.${row.id}`).length > 0
const errors = computed(() => (props.rows ?? []).flatMap(row => editor.errorsIn(`credits.${row.id}`)))
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
    <EditorAlbumCreditsRoles v-if="starting" :model-value="roles!" :exclude="exclude" starting class="shrink-0" @update:model-value="emit('update:roles', $event)" />
    <EditorAlbumCreditsRoles v-else-if="changeable" single :model-value="[role!]" :exclude="exclude" @update:model-value="emit('role', $event[0]!)">
      <template #trigger="{ toggle, attrs }">
        <button
          type="button"
          v-bind="attrs"
          class="group flex w-24 shrink-0 flex-col rounded-md text-left text-xs sm:w-28"
          :title="t('editor.credits.change_role')"
          @click="toggle"
        >
          <span class="flex max-w-full items-center gap-1 font-medium text-primary">
            <span class="truncate group-hover:underline">{{ roleName(role!) }}</span>
            <Icon name="lucide:chevron-down" class="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100" />
          </span>
          <span v-if="roleNameEn(role!)" class="truncate text-[10px] text-meta">{{ roleNameEn(role!) }}</span>
        </button>
      </template>
    </EditorAlbumCreditsRoles>
    <span v-else class="flex w-24 shrink-0 flex-col text-xs sm:w-28">
      <span class="truncate font-medium text-primary">{{ roleName(role!) }}</span>
      <span v-if="roleNameEn(role!)" class="truncate text-[10px] text-meta">{{ roleNameEn(role!) }}</span>
    </span>
    <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <EditorAlbumCreditsPerson
        v-for="row in rows ?? []"
        :key="String(row.id)"
        :person="personOf(row)"
        :invalid="invalid(row)"
        :labelable="canHaveRoleLabel(row.role)"
        :parent="parentOfRow(row)"
        @update="emit('update', row, $event)"
        @remove="emit('remove', row)"
        @parent="setParent(row, $event)"
      />
      <EditorAlbumCreditsAddPerson v-if="!starting || roles!.length" :start-open="starting" @add="emit('add', $event)" />
    </span>
    <UiButton v-if="starting" variant="danger-soft" icon="lucide:trash-2" :label="t('editor.credits.remove_line')" size="xs" class="shrink-0 ring-1 ring-inset ring-danger/20" @click="emit('cancel')" />
    <p v-for="error in errors" :key="error.path" class="w-full text-[11px] text-danger">{{ error.message }}</p>
  </div>
</template>
