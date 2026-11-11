import type { CatalogReferences, CatalogType } from '~/types/catalog'
import type { RevisionAction } from '~/types/revision'
import type { LocalDraftItem } from '~/utils/localDrafts'

/**
 * Drafts kept on the server too, besides this browser's copy (utils/localDrafts):
 *
 * - A harvest candidate's draft, one shared by everyone reviewing the candidate and edited by models through the
 *   harvest MCP server (docs/harvest/README.md#服务器草稿). Each change here is saved there too.
 * - A member's own draft saved to CDCat (docs/catalog/editing.md#草稿): only when they press 「保存到 CDCat」, so it
 *   opens on another device; a model may edit it through the drafts MCP server.
 *
 * A save names the server version it was made from, so a newer one (another reviewer's or device's, the model's)
 * is never overwritten unseen.
 */
export interface ServerDraftMeta {
  version: number
  updated_at: string | null
  updated_via: 'web' | 'mcp'
  updated_by?: { id: number, username: string, nickname: string | null } | null
  /** A member's draft: when the server deletes it, 30 days after its last save. */
  expires_at?: string | null
}

export interface ServerDraft extends ServerDraftMeta {
  items: LocalDraftItem[]
  summary: string | null
  sources: string[]
  references: CatalogReferences
}

/** A member's draft saved to CDCat, as GET /me/drafts lists it. */
export interface PersonalDraftMeta extends ServerDraftMeta {
  scope: string
  type: CatalogType
  action: RevisionAction
  main_ref: string
  entity_id: number | null
  revision_id: number | null
  label: string
  bytes: number
  expires_at: string | null
}

export type PersonalDraft = PersonalDraftMeta & ServerDraft

/** One edit the harvest MCP server made: what it changed, from what to what, and the pages it checked. */
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

/** Where a draft scope is kept on the server, if it can be. */
export type ServerDraftTarget = { kind: 'harvest', candidateId: number } | { kind: 'personal', scope: string }

/** Scopes a member may save to CDCat: a new item, edits of an entity, a revision sent back (RevisionDrafts::SCOPE). */
const PERSONAL_SCOPE = /^(?:(?:album|artist|entry|franchise):(?:new:[a-z0-9]{1,16}|\d{1,10})|revision:\d{1,10})$/

export const serverDraftTarget = (scope: string | null | undefined): ServerDraftTarget | null => {
  const harvest = /^harvest:(\d+)$/.exec(scope ?? '')
  if (harvest) return { kind: 'harvest', candidateId: Number(harvest[1]) }
  return scope && PERSONAL_SCOPE.test(scope) ? { kind: 'personal', scope } : null
}

/** The candidate a draft scope belongs to (`harvest:135`), or null. */
export const serverDraftCandidate = (scope: string | null | undefined): number | null => {
  const target = serverDraftTarget(scope)
  return target?.kind === 'harvest' ? target.candidateId : null
}

/** What a save sends: the draft, the version it was made from, and what a member's draft list shows of it. */
export interface ServerDraftBody {
  items: LocalDraftItem[]
  summary: string
  sources: string[]
  references: CatalogReferences
  version: number | null
  label?: string
  main_ref?: string
  type?: CatalogType
  action?: RevisionAction
  entity_id?: number | null
}

export const serverDrafts = {
  load: (candidateId: number) => useNuxtApp().$api<{ draft: ServerDraft | null }>(`/v1/admin/harvest/candidates/${candidateId}/draft`)
    .then(result => result.draft),
  /** The version and who saved it, with the MCP edits after `since`. */
  meta: (candidateId: number, since?: number | null) => useNuxtApp().$api<{ draft: ServerDraftMeta | null, changes: ServerDraftChange[] }>(
    `/v1/admin/harvest/candidates/${candidateId}/draft`, { query: { meta: 1, ...(since != null ? { since } : {}) } }),
  save: (candidateId: number, body: ServerDraftBody) =>
    useNuxtApp().$api<ServerDraftMeta>(`/v1/admin/harvest/candidates/${candidateId}/draft`, { method: 'PUT', body }),
  remove: (candidateId: number) => useNuxtApp().$api(`/v1/admin/harvest/candidates/${candidateId}/draft`, { method: 'DELETE' }),
}

/** A member's drafts saved to CDCat. Scopes go into the path as they are: only letters, digits and colons. */
export const personalDrafts = {
  list: () => useNuxtApp().$api<{ drafts: PersonalDraftMeta[], limit: number, max_bytes: number, keep_days: number }>('/v1/me/drafts'),
  load: (scope: string) => useNuxtApp().$api<{ draft: PersonalDraft | null }>(`/v1/me/drafts/${scope}`).then(result => result.draft),
  meta: (scope: string) => useNuxtApp().$api<{ draft: PersonalDraftMeta | null }>(`/v1/me/drafts/${scope}`, { query: { meta: 1 } })
    .then(result => result.draft),
  save: (scope: string, body: ServerDraftBody) => useNuxtApp().$api<PersonalDraftMeta>(`/v1/me/drafts/${scope}`, { method: 'PUT', body }),
  remove: (scope: string) => useNuxtApp().$api(`/v1/me/drafts/${scope}`, { method: 'DELETE' }),
}

/** One draft's server copy, whichever kind it is. */
export interface DraftRemote {
  load: () => Promise<ServerDraft | PersonalDraft | null>
  /** The server's version (and the harvest MCP edits after `since`). */
  meta: (since: number | null) => Promise<{ draft: ServerDraftMeta | null, changes: ServerDraftChange[] }>
  save: (body: ServerDraftBody) => Promise<ServerDraftMeta>
  remove: () => Promise<unknown>
}

export const draftRemote = (target: ServerDraftTarget): DraftRemote => target.kind === 'harvest'
  ? {
      load: () => serverDrafts.load(target.candidateId),
      meta: since => serverDrafts.meta(target.candidateId, since),
      save: body => serverDrafts.save(target.candidateId, body),
      remove: () => serverDrafts.remove(target.candidateId),
    }
  : {
      load: () => personalDrafts.load(target.scope),
      meta: () => personalDrafts.meta(target.scope).then(draft => ({ draft, changes: [] })),
      save: body => personalDrafts.save(target.scope, body),
      remove: () => personalDrafts.remove(target.scope),
    }

/** Error names that mean the server copy moved on since this one was loaded or saved. */
export const DRAFT_CHANGED_ERRORS = ['HARVEST_DRAFT_CHANGED', 'DRAFT_CHANGED']
