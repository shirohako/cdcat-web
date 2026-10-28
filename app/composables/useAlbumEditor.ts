import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { CatalogReferences } from '~/types/catalog'
import type { AlbumDocument } from '~/types/document'
import type { useRevisionDraft } from './useRevisionDraft'

export interface FieldError { path: string, message: string }
export type NewItemType = 'artist'
export type AlbumSection = 'basic' | 'tracks' | 'credits' | 'editions' | 'bonuses' | 'images' | 'relations' | 'translate' | 'submit'

/** What the album editor shares with its sections (components/editor/album). */
export interface AlbumEditorContext {
  albumId: number | null
  /** Ref of the album's item: "album", or whatever a loaded revision uses */
  mainRef: Ref<string>
  album: ComputedRef<AlbumDocument>
  draft: ReturnType<typeof useRevisionDraft>
  references: CatalogReferences
  /** Names of the items created in this revision, by ref without "@" */
  pending: ComputedRef<Record<string, string>>
  /** Adds a create item (its ref starts with `prefix`, "ar" / "lb" by default); returns "@ref" for the album document to point at. */
  createItem: (type: NewItemType, document: Record<string, unknown>, prefix?: string) => string
  /** Removes a create item and every reference to it. */
  removeItem: (ref: string) => void
  /** Whether any item of the revision still points at "@ref". */
  referenced: (ref: string) => boolean
  /** Remembers the name of an entity picked in the editor, for labels and the change preview. */
  remember: (type: string, id: number, row: object) => void
  errors: Ref<FieldError[]>
  /** The error at items.album.<path>, if the last submit reported one. */
  errorAt: (...path: Array<string | number>) => string | null
  /** Errors under items.album.<collection> */
  errorsIn: (collection: string) => FieldError[]
  go: (section: AlbumSection) => void
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  /** Printed names in the credits that need a person to look at them, with why (the harvest review page) */
  nameNotes: ComputedRef<Record<string, string>>
}

export const ALBUM_REF = 'album'
export const albumEditorKey: InjectionKey<AlbumEditorContext> = Symbol('album-editor')

export const useAlbumEditor = () => {
  const context = inject(albumEditorKey)
  if (!context) throw new Error('useAlbumEditor() is only available inside the album editor')
  return context
}
