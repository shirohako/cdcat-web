<script setup lang="ts">
import type { UiSelectOption } from '~/components/ui/Select.vue'
import type { RowId } from '~/types/document'
import type { CreditPerson } from '~/utils/creditLines'
import type { ParsedCredits, TrackRef } from '~/utils/creditParser'
import { addCredit, orderedTracks, sortedDiscs, trackRanges, tracksOn } from '~/utils/albumDocument'
import { ALBUM_ONLY_ROLES } from '~/utils/creditLines'
import { foldRoleWord, parseCredits } from '~/utils/creditParser'

/**
 * 粘贴人员表: a credit list pasted from a booklet or a shop page, read by utils/creditParser into roles, names and
 * tracks, its names looked up among the artists (GET /artists/lookup), and shown as a table to check before it is
 * added in one go. Each name becomes the one artist of that name, a new artist (its type picked later), or a
 * printed name only; namesakes and unknown role words stay yellow until settled, and are left out until then.
 * Roles only the whole album has go on the whole album wherever they were written.
 */
const open = defineModel<boolean>({ required: true })

interface Match { id: number, name: string, type: string | null, image_url: string | null, is_pending: boolean }
interface Row {
  key: string
  roleText: string
  roles: string[]
  /** Role words no role goes by; the row shows its role picker while there are any */
  unknown: string[]
  name: string
  detail: string | null
  /** null for the whole album */
  trackIds: RowId[] | null
  /** Track numbers the album has no track for */
  missing: string[]
  /** 'a:<id>' for an artist, 'new', 'name', or '' while namesakes wait for a pick */
  choice: string
  candidates: Match[]
}

const PLACEHOLDER = 'Vocal：星野あかり（M1, M2）\n作詞・作曲：ミナト（M1–M3）、Yuki（M4）\nIllustration：mochi\n\n01. 星屑のアトラス\n編曲：ミナト'

const { t } = useI18n()
const { $api } = useNuxtApp()
const editor = useAlbumEditor()
const people = useCreditPeople()
const { schema, roleName } = useCatalogSchema()
const album = computed(() => editor.album.value)

const text = ref('')

/** Every role's names and other spellings, folded, to the role. */
const roleWords = computed(() => {
  const words = new Map<string, string[]>()
  for (const role of schema.value?.credit_roles ?? []) {
    for (const word of [role.key, ...Object.values(role.names ?? {}), ...(role.aliases ?? [])]) {
      const folded = foldRoleWord(String(word ?? ''))
      if (folded && !words.has(folded)) words.set(folded, [role.key])
    }
  }
  return words
})
const parsed = computed<ParsedCredits>(() => parseCredits(text.value, word => roleWords.value.get(word) ?? []))

// ---- looking the names up ----

const matches = reactive<Record<string, Match[]>>({})
const looking = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const unknownNames = computed(() => [...new Set(parsed.value.lines.flatMap(line => line.names.map(name => name.name)))].filter(name => !(name in matches)))
watch(unknownNames, (names) => {
  clearTimeout(timer)
  if (!names.length) return
  looking.value = true
  timer = setTimeout(async () => {
    try {
      for (let start = 0; start < names.length; start += 100) {
        const data = await $api<{ matches: Record<string, Match[]> }>('/v1/artists/lookup', { query: { 'names[]': names.slice(start, start + 100) }, progress: false })
        for (const name of names.slice(start, start + 100)) matches[name] = data.matches[name] ?? []
      }
    }
    catch {
      // Unmatched names become new artists or printed names, which the user can still change.
      for (const name of names) matches[name] ??= []
    }
    finally {
      looking.value = false
    }
  }, 400)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))

// ---- the table ----

/** What the user changed in a row, kept while the text is edited: by line and name. */
const picks = ref<Record<string, { roles?: string[], choice?: string }>>({})
watch(open, (value) => {
  if (!value) return
  text.value = ''
  picks.value = {}
})

const trackIdsOf = (tracks: TrackRef[] | 'all' | null) => {
  if (tracks === null) return { ids: null, missing: [] }
  if (tracks === 'all') return { ids: orderedTracks(album.value).map(track => track.id), missing: [] }
  const ids: RowId[] = []
  const missing: string[] = []
  for (const ref of tracks) {
    const disc = sortedDiscs(album.value).find(item => item.position === ref.disc)
    const track = disc ? tracksOn(album.value, disc.id).find(item => item.track_number === ref.number) : undefined
    if (track) ids.push(track.id)
    else missing.push(ref.disc > 1 ? `${ref.disc}-${ref.number}` : String(ref.number))
  }
  return { ids: ids.length ? ids : null, missing }
}

const defaultChoice = (candidates: Match[]) => candidates.length === 1 ? `a:${candidates[0]!.id}` : candidates.length ? '' : 'new'

const rows = computed<Row[]>(() => parsed.value.lines.flatMap(line => line.names.map((name, index) => {
  const key = `${line.line}:${index}:${name.name}`
  const candidates = matches[name.name] ?? []
  const roles = picks.value[key]?.roles ?? line.roles
  const albumOnly = roles.length > 0 && roles.every(role => ALBUM_ONLY_ROLES.includes(role))
  const { ids, missing } = albumOnly ? { ids: null, missing: [] } : trackIdsOf(name.tracks)
  return { key, roleText: line.roleText, roles, unknown: line.unknown, name: name.name, detail: name.detail, trackIds: ids, missing, choice: picks.value[key]?.choice ?? defaultChoice(candidates), candidates }
})))
const ready = (row: Row) => row.roles.length > 0 && row.choice !== ''
const count = computed(() => rows.value.filter(ready).reduce((sum, row) => sum + row.roles.length, 0))

const choiceOptions = (row: Row): UiSelectOption<string>[] => [
  ...row.candidates.map(match => ({ value: `a:${match.id}`, label: match.name, hint: `#${match.id}`, group: t('editor.paste_credits.existing') })),
  { value: 'new', label: t('editor.paste_credits.new') },
  { value: 'name', label: t('editor.dialog.name_only') },
]
const setChoice = (row: Row, choice: string) => { picks.value[row.key] = { ...picks.value[row.key], choice } }
const setRoles = (row: Row, roles: string[]) => { picks.value[row.key] = { ...picks.value[row.key], roles } }
const tracksText = (row: Row) => row.trackIds === null ? t('editor.credits.whole_album') : trackRanges(album.value, row.trackIds)

const personOf = (row: Row): CreditPerson => {
  if (row.choice === 'name') return { ...people.printed(row.name), detail: row.detail }
  if (row.choice === 'new') return { ...people.created(row.name), detail: row.detail }
  const match = row.candidates.find(item => `a:${item.id}` === row.choice)!
  const person = people.picked({ id: match.id, label: match.name, subtitle: '', image_url: match.image_url })
  // Matched by another of its names: keep the one printed.
  return { ...person, credited_as: match.name === row.name ? null : row.name, detail: row.detail }
}

const apply = () => {
  for (const row of rows.value.filter(ready)) {
    const person = personOf(row)
    for (const role of row.roles) addCredit(album.value, { ...person, role }, row.trackIds)
  }
  editor.notify(t('editor.paste_credits.added', { count: count.value }))
  open.value = false
}
</script>

<template>
  <EditorModal v-model="open" :title="t('editor.paste_credits.title')" wide as="div">
    <div class="space-y-3">
      <p class="text-sm text-body">{{ t('editor.paste_credits.hint') }}</p>
      <textarea v-model="text" rows="7" class="textarea w-full font-mono text-xs" :placeholder="PLACEHOLDER" :aria-label="t('editor.paste_credits.title')" />

      <div v-if="rows.length" class="max-h-80 overflow-auto rounded-lg border border-line">
        <table class="w-full min-w-[34rem] border-separate border-spacing-0 text-xs">
          <thead class="sticky top-0 z-10 bg-sunken text-[11px] text-meta">
            <tr>
              <th class="px-3 py-1.5 text-left font-semibold">{{ t('editor.paste_credits.col_role') }}</th>
              <th class="px-3 py-1.5 text-left font-semibold">{{ t('editor.paste_credits.col_who') }}</th>
              <th class="px-3 py-1.5 text-left font-semibold">{{ t('editor.paste_credits.col_tracks') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key" :class="ready(row) ? '' : 'bg-warning/10'">
              <td class="border-t border-line px-3 py-1.5 align-middle">
                <span v-if="!row.unknown.length && !picks[row.key]?.roles" class="block font-medium text-title">{{ row.roles.map(roleName).join('、') }}</span>
                <EditorAlbumCreditsRoles v-else :model-value="row.roles" :invalid="!row.roles.length" @update:model-value="setRoles(row, $event)" />
                <span class="block text-[10px] text-faint">{{ row.roleText }}</span>
                <span v-if="row.unknown.length" class="block text-[10px] text-warning">{{ t('editor.paste_credits.unknown_roles', { words: row.unknown.join('、') }) }}</span>
              </td>
              <td class="border-t border-line px-3 py-1.5 align-middle">
                <span class="flex flex-wrap items-center gap-2">
                  <span class="min-w-0">
                    <span class="block truncate font-medium text-title">{{ row.name }}</span>
                    <span v-if="row.detail" class="block truncate text-[10px] text-meta">{{ row.detail }}</span>
                  </span>
                  <UiSelect
                    :model-value="row.choice"
                    :options="choiceOptions(row)"
                    :placeholder="t('editor.paste_credits.namesakes', { count: row.candidates.length })"
                    :invalid="!row.choice"
                    size="xs"
                    class="ml-auto w-36"
                    @update:model-value="setChoice(row, $event as string)"
                  />
                </span>
              </td>
              <td class="border-t border-line px-3 py-1.5 align-middle">
                <span class="text-body">{{ tracksText(row) }}</span>
                <span v-if="row.missing.length" class="block text-[10px] text-warning">{{ t('editor.paste_credits.missing_tracks', { tracks: row.missing.join(', ') }) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="text.trim()" class="rounded-lg bg-sunken px-3 py-2 text-xs text-meta">{{ t('editor.paste_credits.nothing') }}</p>
      <p v-if="parsed.skipped.length" class="text-[11px] text-meta">{{ t('editor.paste_credits.skipped', { lines: parsed.skipped.join(', ') }) }}</p>
    </div>
    <template #footer>
      <span class="mr-auto text-xs text-meta">{{ looking ? t('editor.paste_credits.looking') : rows.some(row => !ready(row)) ? t('editor.paste_credits.unsettled') : '' }}</span>
      <button type="button" class="btn btn-sm bg-btn text-btn-content ring-1 ring-inset ring-line shadow-xs transition hover:bg-btn-hover active:translate-y-px" @click="open = false">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary btn-sm shadow-xs transition active:translate-y-px" :disabled="!count || looking" @click="apply">{{ t('editor.paste_credits.apply', { count }) }}</button>
    </template>
  </EditorModal>
</template>
