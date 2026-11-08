import type { CreditRowPerson, CreditRowRole } from '~/utils/albumCreditPeople'

export interface CreditRow {
  key: string
  roles: CreditRowRole[]
  people: CreditRowPerson[]
}

/**
 * The album's credits with roles held by exactly the same people on one row, so a person with four jobs takes one row.
 * A row stands where its first role stood; the order of the names doesn't matter, but a different credited name or
 * detail does, as the row could only show one of them.
 */
export function mergeCreditRoles(groups: CreditRowRole[]): CreditRow[] {
  const rows = new Map<string, CreditRow>()
  for (const group of groups) {
    const key = group.people.map(person => JSON.stringify([person.artistId, person.name, person.detail])).sort().join('|')
    const row = rows.get(key)
    if (row) row.roles.push(group)
    else rows.set(key, { key, roles: [group], people: group.people })
  }
  return [...rows.values()]
}
