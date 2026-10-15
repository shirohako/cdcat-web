export interface DeletionImpact {
  checksum?: string
  counts: { label: string, count: number }[]
  blockers: string[]
}

export interface AdminAuditEntry {
  id: number
  actor_name: string | null
  action: string
  reason: string | null
  result: string
  created_at: string
}
