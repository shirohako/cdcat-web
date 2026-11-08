/** One person's credit on the album, as AlbumCredits gathers them by role. */
export interface CreditRowPerson {
  /** As credited */
  name: string
  artistId: number | null
  /** The artist's own name, so a credited name holding it links only that part */
  artistName: string | null
  detail: string | null
}

export interface CreditRowRole {
  key: string
  role: string
  role_label: string | null
  category: string
  people: CreditRowPerson[]
}

export interface AlbumCreditPersonRole {
  key: string
  role: string
  role_label: string | null
  category: string
  /** What exactly, such as the instruments played */
  details: string[]
}

export interface AlbumCreditPerson {
  key: string
  name: string
  artistId: number | null
  artistName: string | null
  roles: AlbumCreditPersonRole[]
}

/**
 * The album's credits by person: everyone once, with all their roles in the order of `groups`, and a role's details
 * together. Someone credited under two names stays two people, as the page shows the name that was printed.
 */
export function albumCreditPeople(groups: CreditRowRole[]): AlbumCreditPerson[] {
  const people = new Map<string, AlbumCreditPerson>()
  for (const group of groups) {
    for (const credit of group.people) {
      const key = JSON.stringify([credit.artistId, credit.name])
      const person = people.get(key) ?? { key, name: credit.name, artistId: credit.artistId, artistName: credit.artistName, roles: [] }
      people.set(key, person)
      let role = person.roles.find(item => item.key === group.key)
      if (!role) {
        role = { key: group.key, role: group.role, role_label: group.role_label, category: group.category, details: [] }
        person.roles.push(role)
      }
      if (credit.detail && !role.details.includes(credit.detail)) role.details.push(credit.detail)
    }
  }
  return [...people.values()]
}
