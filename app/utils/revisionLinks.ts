import type { CatalogType } from '~/types/catalog'
import type { RevisionItem, RevisionStatus } from '~/types/revision'
import type { LocalDraft } from '~/utils/localDrafts'
import { CATALOG_RESOURCES } from '~/types/catalog'

/** A stored revision item, or one of a draft (whose resource_id is left out for new items). */
type ItemLike = Pick<RevisionItem, 'resource_type' | 'action'> & { resource_id?: number | null }

/** The item an editor opens a revision with: its album, else its first item. */
export const mainItem = <T extends ItemLike>(items: T[] = []): T | null => items.find(item => item.resource_type === 'album') ?? items[0] ?? null

const EDITORS: Partial<Record<CatalogType, string>> = {
  album: '/contribute/album', artist: '/contribute/artist', label: '/contribute/label',
  work: '/contribute/work', entry: '/contribute/entry', franchise: '/contribute/franchise',
}

/** Whether the submitter can still change the revision: it was sent back for changes. */
export const isOpenRevision = (status: RevisionStatus) => status === 'changes_requested'

/** The editor of a new item; entries are created on their own page. */
const newItemPath = (type: CatalogType, base: string) => type === 'entry' ? `${base}/create` : base

/**
 * Where to continue a revision sent back; null for lyrics, which are edited on their song's page.
 * Once its main item went live at submission (applied_at), the entity itself is edited instead.
 */
export const editorPath = (revision: { id: number, items?: Array<ItemLike & { applied_at?: string | null }> }) => {
  const item = mainItem(revision.items)
  const base = item ? EDITORS[item.resource_type] : undefined
  if (!item || !base) return null
  if (item.applied_at && item.resource_id) return { path: `${base}/${item.resource_id}`, query: {} }
  const path = item.action === 'create' ? newItemPath(item.resource_type, base) : `${base}/${item.resource_id}`
  return { path, query: { revision: String(revision.id) } }
}

/**
 * Where to continue a draft kept in this browser: a revision sent back opens by its id, edits of an
 * entity open with the entity (the editor finds them), and a new item's draft by its scope.
 */
export const draftEditorPath = (draft: Pick<LocalDraft, 'type' | 'action' | 'entityId' | 'revisionId' | 'scope'>) => {
  const base = EDITORS[draft.type]
  if (!base) return null
  const path = draft.action === 'create' || !draft.entityId ? newItemPath(draft.type, base) : `${base}/${draft.entityId}`
  if (draft.revisionId) return { path, query: { revision: String(draft.revisionId) } }
  return draft.entityId ? { path, query: {} } : { path, query: { draft: draft.scope } }
}

/** The public page of an entity; lyrics open their history. */
export const entityPath = (type: string, id: number | null | undefined) => {
  if (!id) return null
  if (type === 'lyric') return `/lyrics/${id}/versions`
  return `/${CATALOG_RESOURCES[type as CatalogType] ?? type}/${id}`
}
