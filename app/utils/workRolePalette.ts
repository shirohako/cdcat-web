export interface WorkRolePalette {
  badge: string
  label: string
  personHover: string
}

const workRolePalettes: WorkRolePalette[] = [
  {
    badge: 'bg-blue-100 text-blue-700',
    label: 'border-blue-100 bg-blue-50/80 text-blue-700',
    personHover: 'hover:bg-blue-100 hover:text-blue-700',
  },
  {
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
    personHover: 'hover:bg-emerald-100 hover:text-emerald-700',
  },
  {
    badge: 'bg-amber-100 text-amber-700',
    label: 'border-amber-100 bg-amber-50/80 text-amber-700',
    personHover: 'hover:bg-amber-100 hover:text-amber-700',
  },
  {
    badge: 'bg-rose-100 text-rose-700',
    label: 'border-rose-100 bg-rose-50/80 text-rose-700',
    personHover: 'hover:bg-rose-100 hover:text-rose-700',
  },
  {
    badge: 'bg-violet-100 text-violet-700',
    label: 'border-violet-100 bg-violet-50/80 text-violet-700',
    personHover: 'hover:bg-violet-100 hover:text-violet-700',
  },
  {
    badge: 'bg-orange-100 text-orange-700',
    label: 'border-orange-100 bg-orange-50/80 text-orange-700',
    personHover: 'hover:bg-orange-100 hover:text-orange-700',
  },
  {
    badge: 'bg-cyan-100 text-cyan-700',
    label: 'border-cyan-100 bg-cyan-50/80 text-cyan-700',
    personHover: 'hover:bg-cyan-100 hover:text-cyan-700',
  },
  {
    badge: 'bg-lime-100 text-lime-800',
    label: 'border-lime-100 bg-lime-50/80 text-lime-800',
    personHover: 'hover:bg-lime-100 hover:text-lime-800',
  },
  {
    badge: 'bg-fuchsia-100 text-fuchsia-700',
    label: 'border-fuchsia-100 bg-fuchsia-50/80 text-fuchsia-700',
    personHover: 'hover:bg-fuchsia-100 hover:text-fuchsia-700',
  },
  {
    badge: 'bg-slate-200 text-slate-700',
    label: 'border-slate-200 bg-slate-100/80 text-slate-700',
    personHover: 'hover:bg-slate-200 hover:text-slate-800',
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

export const getWorkRolePalette = (role: string | null | undefined): WorkRolePalette => {
  const normalizedRole = role?.trim().toLowerCase() || 'credit'
  const assignedIndex = commonRolePaletteIndex[normalizedRole]
  if (assignedIndex !== undefined) return workRolePalettes[assignedIndex]!

  let hash = 2166136261

  for (let index = 0; index < normalizedRole.length; index++) {
    hash ^= normalizedRole.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }

  return workRolePalettes[hash % workRolePalettes.length] || workRolePalettes[0]!
}
