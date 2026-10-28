import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { CreditPerson } from '~/utils/creditLines'

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

  return { nameOf, artistName, isNew, newType, setNewType, noteOf, picked, created, printed, newArtistRef }
}
