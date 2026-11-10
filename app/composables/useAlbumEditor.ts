import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { CatalogReferences } from '~/types/catalog'
import type { AlbumDocument, RowId } from '~/types/document'
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
  /** The album's release date as typed while it can't be read; submitting waits for a fix. */
  rejectedDate: Ref<string | null>
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  /** Printed names in the credits that need a person to look at them, with why (the harvest review page) */
  nameNotes: ComputedRef<Record<string, string>>
  /** Artists (by the name the credits show) whose name was tidied from what the sources print, with how (the harvest review page) */
  nameInfo: ComputedRef<Record<string, string>>
  /** Whether the album still awaits review: its saved tracks may still be removed. False for a new album, whose tracks are all new. */
  albumPending: Ref<boolean>
  /** A saved track of an approved album, which only an administrator removes (docs/catalog/editing.md#删除曲目). */
  isLiveTrack: (id: RowId) => boolean
  /** The album as the edit started (its base version), null for a new one: what renamed tracks are compared with. */
  originalAlbum: ComputedRef<AlbumDocument | null>
}

export const ALBUM_REF = 'album'
export const albumEditorKey: InjectionKey<AlbumEditorContext> = Symbol('album-editor')

export const useAlbumEditor = () => {
  const context = inject(albumEditorKey)
  if (!context) throw new Error('useAlbumEditor() is only available inside the album editor')
  return context
}
