/** Display names of link providers (link_providers.name keys) whose spelling title case gets wrong. */
const PROVIDER_LABELS: Record<string, string> = {
  official_website: 'Official Website',
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
  allmusic: 'AllMusic',
  vndb: 'VNDB',
  anidb: 'AniDB',
  myanimelist: 'MyAnimeList',
  imdb: 'IMDb',
}

/** A provider key as people write the site's name: "vgmdb" → "VGMdb", unknown keys in title case ("dojin_music" → "Dojin Music"). */
export const providerLabel = (name?: string | null) => name
  ? PROVIDER_LABELS[name] ?? name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  : ''

/**
 * Each provider's own hue (OKLCH), loosely after its brand, picked so that providers of one category differ; the
 * album page tints each link's icon with it. Unknown providers get a hue from their name.
 */
const PROVIDER_HUES: Record<string, number> = {
  official_website: 285,
  // streaming
  spotify: 150, apple_music: 10, youtube_music: 28, soundcloud: 55, bandcamp: 205, netease_music: 340,
  // shop
  amazon: 70, itunes: 320, cdjapan: 235, booth: 18, melonbooks: 140, toranoana: 45, dlsite: 260, steam: 215,
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
