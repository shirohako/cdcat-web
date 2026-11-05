<script setup lang="ts">
import type { UiSelectOption } from '~/components/ui/Select.vue'
import type { RowId } from '~/types/document'
import type { CreditPerson } from '~/utils/creditLines'
import type { ParsedCreditName, ParsedCredits, TrackRef } from '~/utils/creditParser'
import type { AlbumCreditRow } from '~/utils/albumDocument'
import { addCredit, canHaveRoleLabel, orderedTracks, setCreditParent, sortedDiscs, trackRanges, tracksOn } from '~/utils/albumDocument'
import { FEATURING_ROLE } from '~/utils/artistLine'
import { ALBUM_ONLY_ROLES } from '~/utils/creditLines'
import { foldRoleWord, newArtistName, parseCredits, voiceCredit } from '~/utils/creditParser'

/**
 * 粘贴人员表: a credit list pasted from a booklet, a shop page or a VGMdb note (examples of each on hover), read by
 * utils/creditParser into roles, names and tracks, its names looked up among the artists (GET /artists/lookup), and
 * shown as a table to check before it is added in one go. Each name becomes the one artist of that name, a new artist (its type picked later), or a
 * printed name only; namesakes and unknown role words stay yellow until settled, and are left out until then.
 * Roles only the whole album has go on the whole album wherever they were written. "A & B" is two people unless
 * the whole of it is an artist's name; who comes after feat. is a 客串 of the name right before it (utils/artistLine).
 * In "紅葉谷希美(CV.遠藤ゆりか)" the person is the voice actor, printed as 紅葉谷希美(CV:遠藤ゆりか).
 * "设计-CD Design" keeps the printed job title as role_label; "custom-Comic" does so under 其他.
 */
const open = defineModel<boolean>({ required: true })

interface Match { id: number, name: string, type: string | null, image_url: string | null, is_pending: boolean }
interface Row {
  key: string
  roleText: string
  roles: string[]
  /** Role words no role goes by; the row shows its role picker while there are any */
  unknown: string[]
  /** The printed job title, while the row has the one role that can take it */
  roleLabel: string | null
  name: string
  detail: string | null
  /** The character a voice actor voices */
  character: string | null
  /** A 客串's: the key of the row it belongs to */
  hostKey: string | null
  /** null for the whole album */
  trackIds: RowId[] | null
  /** Track numbers the album has no track for */
  missing: string[]
  /** 'a:<id>' for an artist, 'new', 'name', or '' while namesakes wait for a pick */
  choice: string
  candidates: Match[]
}

/** The formats it reads, each shown on hover with what it handles (editor.paste_credits.<key>_title, <key>_points). */
const EXAMPLES = [
  { key: 'roles', text: 'Vocal：星野あかり（M1, M2）\n作詞・作曲：ミナト（M1–M3）、Yuki（M4）\nGuitar：Ken（全曲）\nBass：Ken（5弦）\nArtist：Gardens feat. moon jelly（M2）\nIllustration：mochi' },
  { key: 'voices', text: 'Vocal：ルナ(CV.星野あかり)(1-6, 9)、ソラ(CV：蒼井みお)(7, 8)\n作詞：ミナト(1-9)\n作曲：ミナト(1, 7)、Yuki(2-6, 8, 9)' },
  { key: 'blocks', text: '01. 星屑のアトラス\n作詞・作曲：ミナト\n編曲：Yuki\n\n02. 夜明けのプリズム\nVocal：星野あかり\n\nDisc 2\n01. 星屑のアトラス (Instrumental)\n編曲：Yuki\n\nIllustration：mochi' },
  { key: 'notes', text: 'M1.プリズムにさよならを\n   Vocal:nayuta\n   Music&Lyric:鈴谷皆人\n   Guitar&Bass:花形真喜\n\nM-02.\nVocal: つぐ&るる\nVocal Recording Engineer: Yuhi Sumino\n\nIllust: K-ko' },
  { key: 'lists', text: 'Composer: Kaito Mizuno (01, 10, 14)\nArranger: Kaito Mizuno (01, 10, 14)\n\nComposer: Starlit Sound, LLC. (02-09, 11-13)\nArranger: Starlit Sound, LLC. (02-09, 11-13)\nLyricist: Yuki (03, 05)' },
  { key: 'wrapped', text: '艺术家:Minato(1.1)、Yuki(1.2)、黒魔feat.ルナ\n(1.3)、Gardens feat.moon jelly(1.4)、\nKen(2.1)、mochi(2.2)' },
  { key: 'titles', text: 'Mixing: ミナト (Tr.1, Tr.3), Yuki (Tr.2)\ncustom-ReMastering: Yuki\n设计-CD Design: mochi\n\ncustom-Comic: 星野あかり\ncustom-Promotion Movie: Ken, mochi' },
] as const

const { t } = useI18n()
const { separator } = useListPunctuation()
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
// Who came after "feat." is a 客串 rather than in the line's roles, while the dictionary has that role.
const featuringRoles = computed(() => schema.value?.credit_roles.some(role => role.key === FEATURING_ROLE) ? [FEATURING_ROLE] : null)

// ---- looking the names up ----

const matches = reactive<Record<string, Match[]>>({})
const looking = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const unknownNames = computed(() => [...new Set(parsed.value.lines.flatMap(line => line.names.flatMap(name => [name.name, ...(name.unit ? [name.unit.name] : [])])))]
  .filter(name => !(name in matches)))
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

/**
 * The names of a line, the people split from one written name joined again when that whole name is an artist's;
 * `at` maps each parsed name to the entry it ended up in, for a 客串's host.
 */
const namesOf = (names: ParsedCreditName[]) => {
  const result: Array<ParsedCreditName & { index: number }> = []
  const at: number[] = []
  for (let index = 0; index < names.length; index++) {
    const name = names[index]!
    const unit = name.unit
    if (unit && matches[unit.name]?.length) {
      const last = names[index + unit.size - 1]!
      for (let member = 0; member < unit.size; member++) at[index + member] = result.length
      result.push({ ...name, name: unit.name, detail: last.detail, index })
      index += unit.size - 1
    }
    else {
      at[index] = result.length
      result.push({ ...name, index })
    }
  }
  return { names: result, at }
}

const rows = computed<Row[]>(() => parsed.value.lines.flatMap((line) => {
  const { names, at } = namesOf(line.names)
  const keyOf = (name: { index: number, name: string }) => `${line.line}:${name.index}:${name.name}`
  return names.map((name) => {
    const key = keyOf(name)
    const host = name.featuring && name.host !== undefined ? names[at[name.host]!] : undefined
    const candidates = matches[name.name] ?? []
    const roles = picks.value[key]?.roles ?? (name.featuring && featuringRoles.value ? featuringRoles.value : line.roles)
    const albumOnly = roles.length > 0 && roles.every(role => ALBUM_ONLY_ROLES.includes(role))
    const { ids, missing } = albumOnly ? { ids: null, missing: [] } : trackIdsOf(name.tracks)
    return {
      key, roleText: line.roleText, roles, unknown: line.unknown, roleLabel: roles.length === 1 && canHaveRoleLabel(roles[0]!) ? line.roleLabel : null, name: name.name, detail: name.detail, character: name.character ?? null, hostKey: host && host !== name ? keyOf(host) : null,
      trackIds: ids, missing, choice: picks.value[key]?.choice ?? defaultChoice(candidates), candidates,
    }
  })
}))
const ready = (row: Row) => row.roles.length > 0 && row.choice !== ''
const count = computed(() => rows.value.filter(ready).reduce((sum, row) => sum + row.roles.length, 0))

const choiceOptions = (row: Row): UiSelectOption<string>[] => [
  ...row.candidates.map(match => ({ value: `a:${match.id}`, label: match.name, hint: `#${match.id}`, group: t('editor.paste_credits.existing') })),
  { value: 'new', label: t('editor.paste_credits.new') },
  { value: 'name', label: t('editor.dialog.name_only') },
]
const setChoice = (row: Row, choice: string) => { picks.value[row.key] = { ...picks.value[row.key], choice } }
const setRoles = (row: Row, roles: string[]) => { picks.value[row.key] = { ...picks.value[row.key], roles } }
const hostName = (row: Row) => (row.hostKey ? rows.value.find(item => item.key === row.hostKey)?.name ?? '' : '')
const tracksText = (row: Row) => row.trackIds === null ? t('editor.credits.whole_album') : trackRanges(album.value, row.trackIds)

const printedOf = (row: Row, name = row.name) => row.character ? voiceCredit(row.character, name) : name

const personOf = (row: Row): CreditPerson => {
  if (row.choice === 'name') return { ...people.printed(printedOf(row)), detail: row.detail }
  // A Japanese name is created without the spaces between its characters (上杉 悟 → 上杉悟).
  if (row.choice === 'new') {
    const name = newArtistName(row.name)
    return { ...people.created(name), credited_as: row.character ? voiceCredit(row.character, name) : null, detail: row.detail }
  }
  const match = row.candidates.find(item => `a:${item.id}` === row.choice)!
  const person = people.picked({ id: match.id, label: match.name, subtitle: '', image_url: match.image_url })
  // Matched by another of its names: keep the one printed.
  return { ...person, credited_as: match.name === row.name && !row.character ? null : printedOf(row), detail: row.detail }
}

/** Adds the ready rows; then each 客串 belongs to its host's credit on the same track, when the host was added too. */
const apply = () => {
  const added = new Map<string, AlbumCreditRow[]>()
  for (const row of rows.value.filter(ready)) {
    const person = personOf(row)
    added.set(row.key, row.roles.flatMap(role => addCredit(album.value, { ...person, role, role_label: row.roleLabel }, row.trackIds)))
  }
  for (const row of rows.value.filter(item => item.hostKey && added.has(item.key))) {
    const hosts = added.get(row.hostKey!) ?? []
    for (const credit of added.get(row.key)!) {
      const host = hosts.find(item => String(item.track_id ?? '') === String(credit.track_id ?? ''))
      if (host) setCreditParent(album.value, credit, host)
    }
  }
  editor.notify(t('editor.paste_credits.added', { count: count.value }))
  open.value = false
}
</script>

<template>
  <EditorModal v-model="open" :title="t('editor.paste_credits.title')" wide as="div">
    <div class="space-y-3">
      <p class="whitespace-pre-line text-sm text-body">{{ t('editor.paste_credits.hint') }}</p>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="text-meta">{{ t('editor.paste_credits.examples') }}</span>
        <UiTooltip v-for="(example, index) in EXAMPLES" :key="example.key" placement="bottom-start" :delay="150" group="paste-examples" class="w-[26rem] max-w-[calc(100vw-2rem)]">
          <span tabindex="0" class="inline-flex h-6 cursor-help items-center gap-1 rounded-md bg-btn px-2 font-medium text-body hover:bg-btn-hover">
            <Icon name="lucide:file-text" class="size-3.5 text-meta" />{{ t('editor.paste_credits.example', { n: index + 1 }) }}
            <span class="font-normal text-meta">· {{ t(`editor.paste_credits.${example.key}_title`) }}</span>
          </span>
          <template #content>
            <p class="text-xs font-semibold text-title">{{ t(`editor.paste_credits.${example.key}_title`) }}</p>
            <pre class="mt-1.5 whitespace-pre-wrap rounded-md bg-sunken px-2.5 py-2 font-mono text-[11px] leading-4 text-title">{{ example.text }}</pre>
            <p class="mt-2 text-[11px] font-semibold text-title">{{ t('editor.paste_credits.handles') }}</p>
            <ul class="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-body">
              <li v-for="point in t(`editor.paste_credits.${example.key}_points`).split('\n')" :key="point">{{ point }}</li>
            </ul>
          </template>
        </UiTooltip>
      </div>
      <textarea v-model="text" rows="7" class="textarea w-full font-mono text-xs" :placeholder="t('editor.paste_credits.placeholder')" :aria-label="t('editor.paste_credits.title')" />

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
                <span v-if="!row.unknown.length && !picks[row.key]?.roles" class="block font-medium text-title">{{ row.roles.map(roleName).join(separator) }}<span v-if="row.roleLabel" class="ml-1 font-normal text-primary">· {{ row.roleLabel }}</span></span>
                <EditorAlbumCreditsRoles v-else :model-value="row.roles" :invalid="!row.roles.length" @update:model-value="setRoles(row, $event)" />
                <span class="block text-[10px] text-faint">{{ row.roleText }}</span>
                <span v-if="row.unknown.length" class="block text-[10px] text-warning">{{ t('editor.paste_credits.unknown_roles', { words: row.unknown.join(separator) }) }}</span>
              </td>
              <td class="border-t border-line px-3 py-1.5 align-middle">
                <span class="flex flex-wrap items-center gap-2">
                  <span class="min-w-0">
                    <span class="block truncate font-medium text-title">{{ row.name }}<span v-if="hostName(row)" class="ml-1 font-normal text-meta">↳ {{ hostName(row) }}</span></span>
                    <span v-if="row.character" class="block truncate text-[10px] text-meta">{{ printedOf(row) }}</span>
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
      <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="open = false">{{ t('common.cancel') }}</UiButton>
      <UiButton variant="primary" size="sm" class="shadow-xs active:translate-y-px" :disabled="!count || looking" @click="apply">{{ t('editor.paste_credits.apply', { count }) }}</UiButton>
    </template>
  </EditorModal>
</template>
