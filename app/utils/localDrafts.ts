import type { CatalogReferences, CatalogType } from '~/types/catalog'
import type { RevisionAction, RevisionItemInput } from '~/types/revision'

/**
 * Revision drafts live in this browser only, in IndexedDB, until they are submitted
 * (docs/catalog/editing.md#草稿). One record per draft, keyed by user and scope:
 *  - `album:new:<id>`: a new album (and whatever it creates on the way)
 *  - `album:32`: edits of an existing album; one per entity
 *  - `revision:25`: edits of a revision sent back for changes, until it is resubmitted
 * Logging out deletes them all.
 */
export interface LocalDraftItem extends RevisionItemInput {
  document?: Record<string, unknown>
}

export interface LocalDraft {
  /** `${userId}:${scope}` */
  key: string
  userId: number
  scope: string
  /** The item the editor opens with, and what the draft is about. */
  mainRef: string
  type: CatalogType
  action: RevisionAction
  /** The entity edited, if it exists already. */
  entityId: number | null
  /** The revision sent back for changes that this draft continues. */
  revisionId: number | null
  /** Name of the main item when last saved, for lists. */
  label: string
  items: LocalDraftItem[]
  summary: string
  sources: string[]
  references: CatalogReferences
  createdAt: string
  updatedAt: string
}

const DB_NAME = 'cdcat'
const STORE = 'revision-drafts'
let database: Promise<IDBDatabase> | null = null

const open = () => database ??= new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1)
  request.onupgradeneeded = () => {
    const store = request.result.createObjectStore(STORE, { keyPath: 'key' })
    store.createIndex('userId', 'userId')
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => {
    database = null
    reject(request.error)
  }
})

const run = async <T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = operation(transaction.objectStore(STORE))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = transaction.onabort = () => reject(transaction.error ?? request.error)
  })
}

export const draftKey = (userId: number, scope: string) => `${userId}:${scope}`

/** A scope for a new item's draft, e.g. album:new:k3x9q2. */
export const newDraftScope = (type: CatalogType) => `${type}:new:${Math.random().toString(36).slice(2, 10)}`

export const localDrafts = {
  get: (userId: number, scope: string) => run<LocalDraft | undefined>('readonly', store => store.get(draftKey(userId, scope))),
  /**
   * IndexedDB copies the record itself, so pass raw objects (toRaw), not reactive proxies. Should a
   * proxy slip through, the clone fails and a JSON copy is stored instead.
   */
  put: async (draft: LocalDraft) => {
    try {
      return await run('readwrite', store => store.put(draft))
    }
    catch (error) {
      if ((error as DOMException | null)?.name !== 'DataCloneError') throw error
      return run('readwrite', store => store.put(JSON.parse(JSON.stringify(draft)) as LocalDraft))
    }
  },
  remove: (userId: number, scope: string) => run('readwrite', store => store.delete(draftKey(userId, scope))),
  list: async (userId: number) => (await run<LocalDraft[]>('readonly', store => store.index('userId').getAll(userId)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  clear: () => run('readwrite', store => store.clear()),
}

/** Server drafts used to be backed up in localStorage under this prefix; those copies are dropped. */
export const dropLegacyBackups = () => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('cdcat:revision-draft:')) localStorage.removeItem(key)
    }
  }
  catch { /* storage unavailable: nothing to drop */ }
}
