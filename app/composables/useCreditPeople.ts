import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { CreditPerson } from '~/utils/creditLines'

/** Who a printed name was linked to before 取消关联, while the editor is open: by editor, then by the printed name. */
interface Unlinked { artist_id: NonNullable<CreditPerson['artist_id']>, credited_as: string | null, name: string, reopen: boolean }
const unlinkedByEditor = new WeakMap<object, Map<string, Unlinked>>()

/**
 * The people of the album editor's credits (inside the editor only): what to call them, which are new in this
 * revision and still need a type, and the people the pickers add. A name typed twice makes one new artist.
 */
export const useCreditPeople = () => {
  const editor = useAlbumEditor()

  const refOf = (person: CreditPerson) => typeof person.artist_id === 'string' ? person.artist_id.replace(/^@/, '') : null
  const itemOf = (ref: string) => editor.draft.items.value.find(item => item.ref === ref && item.action === 'create')

  const artistName = (id: CreditPerson['artist_id']) => {
    if (id === null) return ''
    if (typeof id === 'string') return editor.pending.value[id.replace(/^@/, '')] ?? ''
    return String((editor.references.artist?.[String(id)] as { name?: string } | undefined)?.name ?? `#${id}`)
  }
  /** The artist's name, or the printed name when there is no artist. */
  const nameOf = (person: CreditPerson) => person.artist_id === null ? (person.credited_as ?? '') : artistName(person.artist_id)
  const isNew = (person: CreditPerson) => refOf(person) !== null
  /** The type of an artist created in this revision; null while nobody has picked one. */
  const newType = (person: CreditPerson) => {
    const ref = refOf(person)
    return ref ? ((itemOf(ref)?.document as { type?: string | null } | undefined)?.type ?? null) : null
  }
  const setNewType = (person: CreditPerson, type: string | null) => {
    const ref = refOf(person)
    const document = ref ? itemOf(ref)?.document : undefined
    if (document) document.type = type
  }
  /** Why the harvest review page wants a person to look at a printed name, if it does. */
  const noteOf = (person: CreditPerson) => person.artist_id === null && person.credited_as ? editor.nameNotes.value[person.credited_as] ?? null : null
  /** How the harvest review page tidied the name of a person's artist from what the sources print, if it did. */
  const infoOf = (person: CreditPerson) => person.artist_id !== null ? editor.nameInfo.value[nameOf(person)] ?? null : null

  /** An artist picked from the search, remembered for its label. */
  const picked = (item: PickedEntity): CreditPerson => {
    editor.remember('artist', item.id, { id: item.id, name: item.label, image_url: item.image_url })
    return { artist_id: item.id, credited_as: null, detail: null }
  }
  /** "@ref" of the artist new in this revision with this name, created on first use; its type is left for the user. */
  const newArtistRef = (name: string) => {
    const same = editor.draft.items.value.find(item => item.action === 'create' && item.resource_type === 'artist'
      && String(item.document?.name ?? '').trim().toLowerCase() === name.trim().toLowerCase())
    return same ? `@${same.ref}` : editor.createItem('artist', { name: name.trim(), type: null })
  }
  const created = (name: string): CreditPerson => ({ artist_id: newArtistRef(name), credited_as: null, detail: null })
  const printed = (name: string): CreditPerson => ({ artist_id: null, credited_as: name.trim(), detail: null })

  // ---- undoing 取消关联 ----

  if (!unlinkedByEditor.has(editor)) unlinkedByEditor.set(editor, reactive(new Map<string, Unlinked>()))
  const unlinked = unlinkedByEditor.get(editor)!
  /** Remembers whom `person` was linked to, now that only `printedName` is left; `reopen` asks its tag to open again. */
  const rememberUnlink = (person: CreditPerson, printedName: string) => {
    if (person.artist_id === null) return
    unlinked.set(printedName, { artist_id: person.artist_id, credited_as: person.credited_as, name: nameOf(person), reopen: true })
  }
  /** Whom a printed name was linked to before, if it was unlinked in this editor. */
  const unlinkedFrom = (person: CreditPerson) => person.artist_id === null && person.credited_as ? unlinked.get(person.credited_as) ?? null : null
  /**
   * The link to put back: the same artist and printed name. A new artist removed from the new items meanwhile is
   * created again under its name.
   */
  const relink = (person: CreditPerson): Pick<CreditPerson, 'artist_id' | 'credited_as'> | null => {
    const before = unlinkedFrom(person)
    if (!before) return null
    unlinked.delete(person.credited_as!)
    const ref = typeof before.artist_id === 'string' ? before.artist_id.replace(/^@/, '') : null
    return { artist_id: ref && !itemOf(ref) ? newArtistRef(before.name) : before.artist_id, credited_as: before.credited_as }
  }

  return { nameOf, artistName, isNew, newType, setNewType, noteOf, infoOf, picked, created, printed, newArtistRef, rememberUnlink, unlinkedFrom, relink }
}
