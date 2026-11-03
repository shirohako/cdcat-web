import { describe, expect, it } from 'vitest'
import type { HarvestCandidateDetail } from '../../app/types/harvest'
import type { AlbumDocument } from '../../app/types/document'
import { buildHarvestDraft } from '../../app/utils/harvestDraft'

/** A candidate with only what the draft reads, and these links. */
const detail = (links: Array<{ url: string, kind: string, provider_id: number | null, provider: string | null }>) => ({
  event: null, people: [], circle_match: null, references: {},
  candidate: {
    title: 'Meltianote。', is_adult: false, artist_id: null,
    merged: {
      title: { value: 'Meltianote。', alternatives: [] }, kind_hint: 'album', release: { date: '2026-04', precision: 'month' },
      descriptions: [], titles: [], media: ['cd'], tracklist: { discs: [], tracks: [], alternatives: [] },
      catalog_numbers: { value: null }, prices: [], barcode: { value: null }, credits: [], sources: [],
      links: links.map(link => ({ ...link, source: 'dojinmusic' })),
    },
  },
}) as unknown as HarvestCandidateDetail

describe('buildHarvestDraft', () => {
  it('keeps the album\'s own X posts and its database page, but not the circle\'s X account', () => {
    const { items } = buildHarvestDraft(detail([
      { url: 'https://www.dojin-music.info/cd/35813', kind: 'source', provider_id: 40, provider: 'dojin_music' },
      { url: 'https://www.youtube.com/watch?v=dyQmm2TGWhw', kind: 'video', provider_id: 8, provider: 'youtube' },
      { url: 'https://x.com/Pik_PiPi/status/2045804602990174328', kind: 'other', provider_id: 5, provider: 'twitter' },
      { url: 'https://x.com/Pik_PiPi', kind: 'other', provider_id: 5, provider: 'twitter' },
    ]))
    const album = items[0]!.document as unknown as AlbumDocument

    expect(album.links.map(link => link.url)).toEqual([
      'https://www.dojin-music.info/cd/35813',
      'https://www.youtube.com/watch?v=dyQmm2TGWhw',
      'https://x.com/Pik_PiPi/status/2045804602990174328',
    ])
  })
})
