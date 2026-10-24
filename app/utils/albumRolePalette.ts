/** Classes for one credit role; each colour has a partner for the dark theme. */
export interface AlbumRolePalette {
  badge: string
  label: string
  personHover: string
}

const albumRolePalettes: AlbumRolePalette[] = [
  {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200',
    label: 'border-blue-100 bg-blue-50/80 text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/15 dark:text-blue-300',
    personHover: 'hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-400/20 dark:hover:text-blue-200',
  },
  {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200',
    label: 'border-emerald-100 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-300',
    personHover: 'hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-400/20 dark:hover:text-emerald-200',
  },
  {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200',
    label: 'border-amber-100 bg-amber-50/80 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/15 dark:text-amber-300',
    personHover: 'hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-400/20 dark:hover:text-amber-200',
  },
  {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200',
    label: 'border-rose-100 bg-rose-50/80 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/15 dark:text-rose-300',
    personHover: 'hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-400/20 dark:hover:text-rose-200',
  },
  {
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200',
    label: 'border-violet-100 bg-violet-50/80 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/15 dark:text-violet-300',
    personHover: 'hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-400/20 dark:hover:text-violet-200',
  },
  {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-400/20 dark:text-orange-200',
    label: 'border-orange-100 bg-orange-50/80 text-orange-700 dark:border-orange-400/25 dark:bg-orange-400/15 dark:text-orange-300',
    personHover: 'hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-400/20 dark:hover:text-orange-200',
  },
  {
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-200',
    label: 'border-cyan-100 bg-cyan-50/80 text-cyan-700 dark:border-cyan-400/25 dark:bg-cyan-400/15 dark:text-cyan-300',
    personHover: 'hover:bg-cyan-100 hover:text-cyan-700 dark:hover:bg-cyan-400/20 dark:hover:text-cyan-200',
  },
  {
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-400/20 dark:text-lime-200',
    label: 'border-lime-100 bg-lime-50/80 text-lime-800 dark:border-lime-400/25 dark:bg-lime-400/15 dark:text-lime-300',
    personHover: 'hover:bg-lime-100 hover:text-lime-800 dark:hover:bg-lime-400/20 dark:hover:text-lime-200',
  },
  {
    badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-200',
    label: 'border-fuchsia-100 bg-fuchsia-50/80 text-fuchsia-700 dark:border-fuchsia-400/25 dark:bg-fuchsia-400/15 dark:text-fuchsia-300',
    personHover: 'hover:bg-fuchsia-100 hover:text-fuchsia-700 dark:hover:bg-fuchsia-400/20 dark:hover:text-fuchsia-200',
  },
  // Neutral: the theme's own button and line colours.
  {
    badge: 'bg-btn text-btn-content',
    label: 'border-line bg-sunken text-body',
    personHover: 'hover:bg-btn hover:text-title',
  },
]

const commonRolePaletteIndex: Record<string, number> = {
  composer: 0,
  composition: 0,
  arranger: 1,
  arrangement: 1,
  lyricist: 2,
  lyrics: 2,
  artist: 3,
  vocal: 3,
  vocals: 3,
  producer: 4,
  production: 4,
  mixing: 5,
  mixer: 5,
  mastering: 6,
  performer: 7,
  illustrator: 8,
  artwork: 8,
  designer: 9,
}

export const getAlbumRolePalette = (role: string | null | undefined): AlbumRolePalette => {
  const normalizedRole = role?.trim().toLowerCase() || 'credit'
  const assignedIndex = commonRolePaletteIndex[normalizedRole]
  if (assignedIndex !== undefined) return albumRolePalettes[assignedIndex]!

  let hash = 2166136261

  for (let index = 0; index < normalizedRole.length; index++) {
    hash ^= normalizedRole.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }

  return albumRolePalettes[hash % albumRolePalettes.length] || albumRolePalettes[0]!
}
