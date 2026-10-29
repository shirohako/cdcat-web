import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { TracklistDisc, TracklistPrefs, TracklistRow } from '~/utils/tracklistView'
import { normalizeTracklistPrefs } from '~/utils/tracklistView'

/**
 * The album tracklist's view preferences (style, density, the two hover cards), kept in one cookie so the server
 * renders the reader's last choice. Reading never writes the cookie back, so pages without a choice send no Set-Cookie.
 * Call it once, in AlbumTracklist, and share the result through the context.
 */
export const useTracklistPrefs = (styleKeys: readonly string[]) => {
  const cookie = useCookie<Partial<TracklistPrefs> | undefined>('album_tracklist', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  const prefs = computed(() => normalizeTracklistPrefs(cookie.value, styleKeys))
  const update = (patch: Partial<TracklistPrefs>) => {
    cookie.value = { ...prefs.value, ...patch }
  }
  return { prefs, update }
}

/**
 * What every part of the tracklist shares: the preferences, folded discs, favourites and the lyrics dialog. The
 * tracklist provides it; styles and row parts inject it, so a new style only renders rows.
 */
export interface TracklistContext {
  prefs: ComputedRef<TracklistPrefs>
  /** Albums awaiting review: no hearts yet */
  locked: ComputedRef<boolean>
  folded: Ref<Set<number>>
  toggleDisc: (disc: TracklistDisc, header: HTMLElement | null) => void
  /** Tracks whose favourite request is on its way */
  favoriting: Ref<Set<number>>
  toggleFavorite: (row: TracklistRow) => void
  openLyrics: (row: TracklistRow, prefer: 'original' | 'translation') => void
}

const KEY: InjectionKey<TracklistContext> = Symbol('album-tracklist')

export const provideTracklist = (context: TracklistContext) => provide(KEY, context)

export const useTracklist = () => {
  const context = inject(KEY)
  if (!context) throw new Error('useTracklist() needs an AlbumTracklist above it')
  return context
}
