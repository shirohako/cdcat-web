/** Display names of link providers (link_providers.name keys) whose spelling title case gets wrong. */
const PROVIDER_LABELS: Record<string, string> = {
  official_website: 'Official Website',
  xfd: 'XFD',
  oshinagaki: 'お品書き',
  twitter: 'X (Twitter)',
  youtube: 'YouTube',
  youtube_music: 'YouTube Music',
  tiktok: 'TikTok',
  soundcloud: 'SoundCloud',
  netease_music: 'NetEase Music',
  itunes: 'iTunes',
  cdjapan: 'CDJapan',
  booth: 'BOOTH',
  dlsite: 'DLsite',
  musicbrainz: 'MusicBrainz',
  vgmdb: 'VGMdb',
  vocadb: 'VocaDB',
  touhoudb: 'TouhouDB',
  utaitedb: 'UtaiteDB',
  thbwiki: 'THBWiki',
  dojin_music: '同人音楽info',
  allmusic: 'AllMusic',
  vndb: 'VNDB',
  anidb: 'AniDB',
  myanimelist: 'MyAnimeList',
  imdb: 'IMDb',
  amazon_music: 'Amazon Music',
  tidal: 'TIDAL',
  kkbox: 'KKBOX',
  line_music: 'LINE MUSIC',
  qq_music: 'QQ Music',
  linkcore: 'LinkCore',
  recochoku: 'RecoChoku',
  mora: 'mora',
  ototoy: 'OTOTOY',
  seven_digital: '7digital',
  tower_records: 'TOWER RECORDS',
  hmv: 'HMV',
  animate: 'animate',
  gamers: 'GAMERS',
  sevennet: '7net Shopping',
  yodobashi: 'yodobashi.com',
  mandarake: 'MANDARAKE',
  diskunion: 'diskunion',
  yesasia: 'YesAsia',
  play_asia: 'Play-Asia',
  alice_books: 'ALICE BOOKS',
  diverse_direct: 'DIVERSE DIRECT',
  dizzylab: 'dizzylab',
  fanza: 'FANZA',
  aniplex_plus: 'ANIPLEX+',
  square_enix_store: 'SQUARE ENIX STORE',
  cystore: 'CyStore',
  ebten: 'ebten',
  tanoc_store: 'TANO*C STORE',
  gog: 'GOG',
  itch_io: 'itch.io',
  mega: 'MEGA',
  mediafire: 'MediaFire',
}

/** A provider key as people write the site's name: "vgmdb" → "VGMdb", unknown keys in title case ("sony_music_shop" → "Sony Music Shop"). */
export const providerLabel = (name?: string | null) => name
  ? PROVIDER_LABELS[name] ?? name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  : ''

/**
 * Each provider's own hue (OKLCH), loosely after its brand, picked so that providers of one category differ; the
 * album page tints each link's icon with it. Unknown providers get a hue from their name.
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

export const providerHue = (name?: string | null) => {
  if (!name) return null
  const known = PROVIDER_HUES[name]
  if (known !== undefined) return known
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

/** The order link categories show in, on pages and in the editor; links keep their own order inside a category. */
export const LINK_CATEGORIES = ['official', 'promotion', 'streaming', 'shop', 'social', 'database', 'other']

/** A category's place in LINK_CATEGORIES; unknown categories come last. */
export const linkCategoryRank = (category?: string | null) => {
  const index = LINK_CATEGORIES.indexOf(category ?? 'other')
  return index === -1 ? LINK_CATEGORIES.length : index
}
