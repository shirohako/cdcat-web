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

/** Where to continue a draft or a revision sent back; null for lyrics, which are edited on their song's page. */
export const editorPath = (revision: { id: number, items?: ItemLike[] }) => {
  const item = mainItem(revision.items)
  const base = item ? EDITORS[item.resource_type] : undefined
  if (!item || !base) return null
  const path = item.action === 'create' ? (item.resource_type === 'entry' ? `${base}/create` : base) : `${base}/${item.resource_id}`
  return { path, query: { revision: String(revision.id) } }
}

/** The public page of an entity; lyrics open their history. */
export const entityPath = (type: string, id: number | null | undefined) => {
  if (!id) return null
  if (type === 'lyric') return `/lyrics/${id}/versions`
  return `/${CATALOG_RESOURCES[type as CatalogType] ?? type}/${id}`
}
