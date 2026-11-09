/**
 * Each provider's own hue (OKLCH), loosely after its brand, picked so that providers of one category differ; the
 * album page tints each link's icon with it. Unknown providers get a hue from their key.
 */
const PROVIDER_HUES: Record<string, number> = {
  official_website: 285,
  // promotion
  xfd: 300, oshinagaki: 30,
  // streaming
  spotify: 150, apple_music: 10, youtube_music: 28, soundcloud: 55, bandcamp: 205, netease_music: 340,
  amazon_music: 190, deezer: 300, tidal: 240, qobuz: 225, kkbox: 170, line_music: 135, qq_music: 95, linkcore: 270, linkfire: 35,
  // shop
  amazon: 70, itunes: 320, cdjapan: 235, booth: 18, melonbooks: 140, toranoana: 45, dlsite: 260, steam: 215,
  recochoku: 0, mora: 200, ototoy: 85, seven_digital: 170, beatport: 120, tower_records: 50, hmv: 345, animate: 30,
  gamers: 225, getchu: 285, sevennet: 15, yodobashi: 355, rakuten: 5, surugaya: 245, mandarake: 60, diskunion: 270,
  yesasia: 25, play_asia: 210, alice_books: 330, diverse_direct: 180, dizzylab: 160, gyutto: 100, fanza: 10,
  aniplex_plus: 250, sony_music_shop: 0, square_enix_store: 230, cystore: 310, ebten: 40, tanoc_store: 290,
  laced_records: 65, limited_run_games: 20, gog: 295, itch_io: 355,
  // other
  kickstarter: 145, internet_archive: 60, google_drive: 140, mega: 5, mediafire: 220,
  // social
  twitter: 235, facebook: 265, instagram: 350, youtube: 25, tiktok: 190, weibo: 60,
  // database
  vgmdb: 250, musicbrainz: 330, discogs: 75, bangumi: 5, dojin_music: 150, vocadb: 195, touhoudb: 40,
  utaitedb: 295, thbwiki: 110, wikipedia: 220, allmusic: 175, vndb: 270, anidb: 230, myanimelist: 255, imdb: 90,
}

export const providerHue = (key?: string | null) => {
  if (!key) return null
  const known = PROVIDER_HUES[key]
  if (known !== undefined) return known
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

/** The order link categories show in, on pages and in the editor; links keep their own order inside a category. */
export const LINK_CATEGORIES = ['official', 'promotion', 'streaming', 'shop', 'social', 'database', 'other']

/** A category's place in LINK_CATEGORIES; unknown categories come last. */
export const linkCategoryRank = (category?: string | null) => {
  const index = LINK_CATEGORIES.indexOf(category ?? 'other')
  return index === -1 ? LINK_CATEGORIES.length : index
}

/** The categories that have an icon of their own; any other category shows as `other`. */
const KNOWN_CATEGORIES = new Set(LINK_CATEGORIES)

/** A link category as shown: unknown or missing categories count as `other`. */
export const linkCategoryKey = (category?: string | null) => category && KNOWN_CATEGORIES.has(category) ? category : 'other'

/** A link tile's hue: the site's own, so links of one category differ; links without a known site stay grey (null). */
export const linkTileHue = (category?: string | null, providerKey?: string | null) =>
  !providerKey || linkCategoryKey(category) === 'other' ? null : providerHue(providerKey)

/** The host a link points at, without `www.`; the address itself when it isn't one. */
export const linkHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** The name a link shows under: its own name when it has one, else the site's, else the host. */
export const linkName = (link: { url: string, label?: string | null, provider?: { name?: string | null } | null }) =>
  link.label?.trim() || link.provider?.name || linkHost(link.url)

/**
 * An address in three parts, as written, so the host can stand out: `https://` + `store.example.com` +
 * `/items/1?x=2`. Anything that doesn't start with a scheme and `//` is all `rest`.
 */
export const splitUrl = (url: string) => {
  const match = /^([a-z][a-z\d+.-]*:\/\/)([^/?#]*)(.*)$/is.exec(url)
  return match ? { scheme: match[1]!, host: match[2]!, rest: match[3]! } : { scheme: '', host: '', rest: url }
}
