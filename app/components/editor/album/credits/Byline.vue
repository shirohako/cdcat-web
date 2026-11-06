<script setup lang="ts">
import type { AlbumCreditRow } from '~/utils/albumDocument'
import type { CreditPerson } from '~/utils/creditLines'
import { addCredit, patchCredits, removeCredits } from '~/utils/albumDocument'
import { VARIOUS_ARTISTS } from '~/utils/albumByline'
import { bylineCredits } from '~/utils/creditLines'

/**
 * 署名与发行, above both views: who the album is by and who puts it out, then (behind 更多, open when used) label,
 * distributor, manufacturer and planning. Under them, the line album lists will show (App\Support\AlbumByline): the
 * publishers, else the 艺术家, several of them reading Various Artists on cards.
 */
const { t } = useI18n()
const { aside } = useListPunctuation()
const editor = useAlbumEditor()
const people = useCreditPeople()
const album = computed(() => editor.album.value)

const MAIN = ['artist', 'publisher']
const MORE = ['label', 'distributor', 'manufacturer', 'planning']
const showMore = ref(MORE.some(role => bylineCredits(album.value, role).length > 0))
const roles = computed(() => showMore.value ? [...MAIN, ...MORE] : MAIN)

const add = (role: string, person: CreditPerson) => addCredit(album.value, { ...person, role }, null)
const update = (row: AlbumCreditRow, patch: Partial<CreditPerson>) => patchCredits(album.value, [row], patch)
const remove = (row: AlbumCreditRow) => removeCredits(album.value, [row])

const preview = computed(() => {
  for (const role of ['publisher', 'artist']) {
    const names = [...new Set(bylineCredits(album.value, role).map(row => row.credited_as || people.artistName(row.artist_id)).filter(Boolean))]
    if (!names.length) continue
    return role === 'artist' && names.length > 1 ? names.join(', ') + aside(t('editor.album.byline_various', { name: VARIOUS_ARTISTS })) : names.join(', ')
  }
  return ''
})
</script>

<template>
  <EditorAlbumCreditsBlock name="byline" :title="t('editor.credits.byline_title')" scope="album">
    <template #hint>
      <p>{{ t('editor.credits.byline_hint') }}</p>
      <EditorAlbumCreditsBylineGuide class="mt-2" />
    </template>
    <div class="space-y-2">
      <EditorAlbumCreditsRoleRow
        v-for="role in roles"
        :key="role"
        :role="role"
        :rows="bylineCredits(album, role)"
        @add="add(role, $event)"
        @update="update"
        @remove="remove"
      />
      <UiButton v-if="!showMore" size="xs" icon="lucide:plus" icon-class="size-3" class="gap-1 ring-1 ring-inset ring-line" @click="showMore = true">{{ t('editor.credits.byline_more') }}</UiButton>
      <p class="rounded-md bg-sunken px-3 py-1.5 text-xs text-body">
        <span class="mr-2 text-[11px] uppercase tracking-wider text-meta">{{ t('editor.album.byline_preview') }}</span>
        <template v-if="preview">{{ preview }}</template>
        <span v-else class="text-meta">{{ t('editor.album.byline_none') }}</span>
      </p>
    </div>
  </EditorAlbumCreditsBlock>
</template>
