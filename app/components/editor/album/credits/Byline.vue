<script setup lang="ts">
import type { AlbumCreditRow } from '~/utils/albumDocument'
import type { CreditPerson } from '~/utils/creditLines'
import { addCredit, patchCredits, removeCredits } from '~/utils/albumDocument'
import { BYLINE_ROLES, bylineCredits } from '~/utils/creditLines'

/** 专辑署名, above the rest: who the album is by and who puts it out, the roles that decide the names under its title. */
const { t } = useI18n()
const editor = useAlbumEditor()
const album = computed(() => editor.album.value)

const add = (role: string, person: CreditPerson) => addCredit(album.value, { ...person, role }, null)
const update = (row: AlbumCreditRow, patch: Partial<CreditPerson>) => patchCredits(album.value, [row], patch)
const remove = (row: AlbumCreditRow) => removeCredits(album.value, [row])
</script>

<template>
  <EditorAlbumCreditsBlock kind="byline" :title="t('editor.credits.byline_title')" :description="t('editor.credits.byline_description')">
    <div class="space-y-2">
      <EditorAlbumCreditsRoleRow
        v-for="role in BYLINE_ROLES"
        :key="role"
        :role="role"
        :rows="bylineCredits(album, role)"
        @add="add(role, $event)"
        @update="update"
        @remove="remove"
      />
    </div>
  </EditorAlbumCreditsBlock>
</template>
