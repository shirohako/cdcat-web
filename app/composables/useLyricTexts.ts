import type { Lyric } from '~/types/lyric'

/**
 * The lyric texts a track's panel has loaded, by lyric id. Kept in the page's state rather than in the panel, so
 * the texts the server rendered come to the browser with the page (no second request, no flash of a skeleton), and
 * the track page can quote the lyrics' first lines in its description.
 */
export const useLyricTexts = (trackId: number) => useState<Record<number, Lyric>>(`track:${trackId}:lyric-texts`, () => ({}))
