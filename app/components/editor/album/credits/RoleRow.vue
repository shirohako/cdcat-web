<script setup lang="ts">
import type { AlbumCreditRow } from '~/utils/albumDocument'
import type { CreditPerson } from '~/utils/creditLines'
import { personOf } from '~/utils/creditLines'

/**
 * One role on a track (or on the whole album) in the by-track view and the byline block: its name, a tag per
 * person, and a search to add another. `roles` makes it a row being started, with the role still to pick; then the
 * search opens as soon as there is one. Each tag is one credit row.
 */
const props = defineProps<{ role?: string, rows?: AlbumCreditRow[], roles?: string[] }>()
const emit = defineEmits<{
  'add': [person: CreditPerson]
  'update': [row: AlbumCreditRow, patch: Partial<CreditPerson>]
  'remove': [row: AlbumCreditRow]
  'update:roles': [roles: string[]]
}>()

const editor = useAlbumEditor()
const { roleName, roleNameEn } = useCatalogSchema()
const starting = computed(() => props.roles !== undefined)
const invalid = (row: AlbumCreditRow) => editor.errorsIn(`credits.${row.id}`).length > 0
const errors = computed(() => (props.rows ?? []).flatMap(row => editor.errorsIn(`credits.${row.id}`)))
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
    <EditorAlbumCreditsRoles v-if="starting" :model-value="roles!" class="shrink-0" @update:model-value="emit('update:roles', $event)" />
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
        @update="emit('update', row, $event)"
        @remove="emit('remove', row)"
      />
      <EditorAlbumCreditsAddPerson v-if="!starting || roles!.length" :start-open="starting" @add="emit('add', $event)" />
    </span>
    <p v-for="error in errors" :key="error.path" class="w-full text-[11px] text-danger">{{ error.message }}</p>
  </div>
</template>
