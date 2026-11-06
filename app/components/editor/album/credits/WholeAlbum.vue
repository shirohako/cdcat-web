<template>
  <EditorAlbumCreditsBlock name="album" :title="t('editor.credits.contributors')" scope="album">
    <div class="space-y-2">
      <EditorAlbumCreditsRoleRow
        v-for="item in credits"
        :key="item.role"
        :role="item.role"
        :rows="item.rows"
        changeable
        :exclude="EXCLUDED_ROLES"
        @add="add(item.role, $event)"
        @role="changeRole(item.rows, $event)"
        @update="update"
        @remove="remove"
      />
      <EditorAlbumCreditsRoleRow v-if="started" v-model:roles="started" @add="firstPerson" @cancel="started = undefined" />
      <EditorAlbumCreditsStartRow v-else @start="started = []" />
    </div>
  </EditorAlbumCreditsBlock>
</template>

<script setup lang="ts">
import type { AlbumCreditRow } from '~/utils/albumDocument'
import type { CreditPerson } from '~/utils/creditLines'
import { addCredit, changeCreditRole, patchCredits, removeCredits } from '~/utils/albumDocument'
import { creditsOn } from '~/utils/creditLines'

/**
 * 参与创作 (专辑): the credits of the whole album outside the byline block, by role. A role's name changes the role of
 * the whole row, but not to 艺术家, which is the byline block's. A row being started has its role picked first and
 * stays here until its first person.
 */
const EXCLUDED_ROLES = ['artist']

const { t } = useI18n()
const editor = useAlbumEditor()
const { roleOrder } = useCatalogSchema()
const album = computed(() => editor.album.value)

const credits = computed(() => creditsOn(album.value, null, roleOrder))
const started = ref<string[] | undefined>()

const add = (role: string, person: CreditPerson) => addCredit(album.value, { ...person, role }, null)
const firstPerson = (person: CreditPerson) => {
  for (const role of started.value ?? []) add(role, person)
  started.value = undefined
}
const update = (row: AlbumCreditRow, patch: Partial<CreditPerson>) => patchCredits(album.value, [row], patch)
const remove = (row: AlbumCreditRow) => removeCredits(album.value, [row])
const changeRole = (rows: AlbumCreditRow[], role: string) => changeCreditRole(album.value, rows, role)
</script>
