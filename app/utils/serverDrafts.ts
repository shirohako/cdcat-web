import type { CatalogReferences } from '~/types/catalog'
import type { LocalDraftItem } from '~/utils/localDrafts'

/**
 * Harvest candidates' drafts are also kept on the server, one shared by everyone reviewing the
 * candidate and edited by models through the MCP server (docs/harvest/README.md#服务器草稿). The
 * browser keeps its copy too (utils/localDrafts) and saves each change to both; a save names the
 * server version it was made from, so a newer one (another reviewer's, the model's) is never
 * overwritten unseen.
 */
export interface ServerDraftMeta {
  version: number
  updated_at: string | null
  updated_via: 'web' | 'mcp'
  updated_by: { id: number, username: string, nickname: string | null } | null
}

export interface ServerDraft extends ServerDraftMeta {
  items: LocalDraftItem[]
  summary: string | null
  sources: string[]
  references: CatalogReferences
}

/** One edit the MCP server made: what it changed, from what to what, and the pages it checked. */
export interface ServerDraftChange {
  version: number
  via: 'mcp'
  op: string
  item: string | null
  path: string
  before: unknown
  after: unknown
  evidence: string[]
  note: string | null
  by: string | null
  at: string | null
}

/** The candidate a draft scope belongs to (`harvest:135`), or null: other drafts stay in the browser only. */
export const serverDraftCandidate = (scope: string | null | undefined): number | null => {
  const match = /^harvest:(\d+)$/.exec(scope ?? '')
  return match ? Number(match[1]) : null
}

export const serverDrafts = {
  load: (candidateId: number) => useNuxtApp().$api<{ draft: ServerDraft | null }>(`/v1/admin/harvest/candidates/${candidateId}/draft`)
    .then(result => result.draft),
  /** The version and who saved it, with the MCP edits after `since`. */
  meta: (candidateId: number, since?: number | null) => useNuxtApp().$api<{ draft: ServerDraftMeta | null, changes: ServerDraftChange[] }>(
    `/v1/admin/harvest/candidates/${candidateId}/draft`, { query: { meta: 1, ...(since != null ? { since } : {}) } }),
  save: (candidateId: number, body: { items: LocalDraftItem[], summary: string, sources: string[], references: CatalogReferences, version: number | null }) =>
    useNuxtApp().$api<ServerDraftMeta>(`/v1/admin/harvest/candidates/${candidateId}/draft`, { method: 'PUT', body }),
  remove: (candidateId: number) => useNuxtApp().$api(`/v1/admin/harvest/candidates/${candidateId}/draft`, { method: 'DELETE' }),
}
