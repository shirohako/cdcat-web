import type { CatalogType } from '~/types/catalog'
import type { RevisionItem, RevisionStatus } from '~/types/revision'
import { CATALOG_RESOURCES } from '~/types/catalog'

type ItemLike = Pick<RevisionItem, 'resource_type' | 'resource_id' | 'action'>

/** The item an editor opens a revision with: its album, else its first item. */
export const mainItem = <T extends ItemLike>(items: T[] = []): T | null => items.find(item => item.resource_type === 'album') ?? items[0] ?? null

const EDITORS: Partial<Record<CatalogType, string>> = {
  album: '/contribute/album', artist: '/contribute/artist', label: '/contribute/label',
  work: '/contribute/work', entry: '/contribute/entry', franchise: '/contribute/franchise',
}

/** Whether the submitter can still change the revision. */
export const isOpenRevision = (status: RevisionStatus) => status === 'draft' || status === 'changes_requested'

/**
 * Where to continue a draft or a revision sent back; null for lyrics, which are edited on their song's
 * page. Once its main item went live at submission (applied_at), the entity itself is edited instead.
 */
export const editorPath = (revision: { id: number, items?: Array<ItemLike & { applied_at?: string | null }> }) => {
  const item = mainItem(revision.items)
  const base = item ? EDITORS[item.resource_type] : undefined
  if (!item || !base) return null
  if (item.applied_at && item.resource_id) return { path: `${base}/${item.resource_id}`, query: {} }
  const path = item.action === 'create' ? (item.resource_type === 'entry' ? `${base}/create` : base) : `${base}/${item.resource_id}`
  return { path, query: { revision: String(revision.id) } }
}

/** The public page of an entity; lyrics open their history. */
export const entityPath = (type: string, id: number | null | undefined) => {
  if (!id) return null
  if (type === 'lyric') return `/lyrics/${id}/versions`
  return `/${CATALOG_RESOURCES[type as CatalogType] ?? type}/${id}`
}
