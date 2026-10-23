import { describe, expect, it } from 'vitest'
import {
  addBonus, addCredit, addDisc, addProduct, addTrack, coverOf, creditGroups, emptyAlbumDocument, importTracklist,
  missingRequired, moveDisc, moveTrack, moveTrackToDisc, orderedTracks, pruneAlbumDocument, removeBonus, removeDisc,
  removeProduct, removeTrack, setCover, setCreditScope, setCreditTracks, setDiscBonus, setTitleIn, sortedDiscs, titleIn,
  tracksOn, untickedDiscs, updateCreditGroup, upgradeAlbumDocument,
} from '../../app/utils/albumDocument'
import { parseTracklist } from '../../app/utils/tracklistParser'

const album = () => {
  const doc = emptyAlbumDocument()
  const disc = doc.discs[0]!
  addTrack(doc, disc.id, { title: 'A' })
  addTrack(doc, disc.id, { title: 'B' })
  addTrack(doc, disc.id, { title: 'C' })
  return { doc, disc }
}

const titles = (doc: ReturnType<typeof emptyAlbumDocument>, discId: string | number) => tracksOn(doc, discId).map(track => `${track.track_number}:${track.title}`)

describe('discs and tracks', () => {
  it('numbers new tracks and keeps 1..n after a removal', () => {
    const { doc, disc } = album()
    removeTrack(doc, tracksOn(doc, disc.id)[1]!.id)
    expect(titles(doc, disc.id)).toEqual(['1:A', '2:C'])
  })

  it('leaves gaps alone when the disc was not numbered 1..n', () => {
    const { doc, disc } = album()
    tracksOn(doc, disc.id)[2]!.track_number = 9
    removeTrack(doc, tracksOn(doc, disc.id)[0]!.id)
    expect(titles(doc, disc.id)).toEqual(['2:B', '9:C'])
  })

  it('removes what hangs on a removed track', () => {
    const { doc, disc } = album()
    const track = tracksOn(doc, disc.id)[0]!
    doc.track_titles.push({ id: 'x', track_id: track.id, title: 'A (en)', locale: 'en', kind: 'translation' })
    addCredit(doc, { artist_id: 1, credited_as: null, role: 'composer', detail: null }, [track.id])
    addCredit(doc, { artist_id: 1, credited_as: null, role: 'producer', detail: null }, null)
    removeTrack(doc, track.id)
    expect(doc.track_titles).toEqual([])
    expect(doc.credits.map(credit => credit.role)).toEqual(['producer'])
  })

  it('drops the 原曲 of a removed track and those pointing at it', () => {
    const { doc, disc } = album()
    const [a, b, c] = tracksOn(doc, disc.id).map((track, index) => Object.assign(track, { id: 10 + index }))
    doc.track_originals.push(
      { id: 'o1', track_id: a!.id, original_track_id: 500, original_title: null },
      { id: 'o2', track_id: b!.id, original_track_id: a!.id, original_title: null },
      { id: 'o3', track_id: c!.id, original_track_id: null, original_title: '亡き王女の為のセプテット' },
    )
    removeTrack(doc, a!.id)
    expect(doc.track_originals.map(row => row.id)).toEqual(['o3'])
  })

  it('moves tracks within and across discs', () => {
    const { doc, disc } = album()
    moveTrack(doc, tracksOn(doc, disc.id)[2]!.id, -1)
    expect(titles(doc, disc.id)).toEqual(['1:A', '2:C', '3:B'])
    const second = addDisc(doc)
    moveTrackToDisc(doc, tracksOn(doc, disc.id)[0]!.id, second.id)
    expect(titles(doc, disc.id)).toEqual(['1:C', '2:B'])
    expect(titles(doc, second.id)).toEqual(['1:A'])
    expect(orderedTracks(doc).map(track => track.title)).toEqual(['C', 'B', 'A'])
  })

  it('renumbers discs after a removal and swaps on move', () => {
    const { doc, disc } = album()
    const second = addDisc(doc, { format: 'bd' })
    const third = addDisc(doc)
    expect(third.format).toBe('bd')
    removeDisc(doc, second.id)
    expect(sortedDiscs(doc).map(item => [item.id, item.position])).toEqual([[disc.id, 1], [third.id, 2]])
    moveDisc(doc, third.id, -1)
    expect(sortedDiscs(doc).map(item => item.id)).toEqual([third.id, disc.id])
    expect(doc.tracks).toHaveLength(3)
  })

  it('imports a pasted tracklist by number, then appends', () => {
    const { doc, disc } = album()
    expect(importTracklist(doc, parseTracklist('1. A 3:00\n2. Bee\n3. C\n4. D'))).toEqual({ added: 1, updated: 2 })
    expect(titles(doc, disc.id)).toEqual(['1:A', '2:Bee', '3:C', '4:D'])
    expect(tracksOn(doc, disc.id)[0]!.duration).toBe(180)
    importTracklist(doc, parseTracklist('E\nDisc 2\n1. F'), 'append')
    expect(titles(doc, disc.id)).toEqual(['1:A', '2:Bee', '3:C', '4:D', '5:E'])
    expect(sortedDiscs(doc)).toHaveLength(2)
  })
})

describe('editions and bonuses', () => {
  it('ticks main discs in editions and keeps every main disc in one', () => {
    const { doc, disc } = album()
    const regular = addProduct(doc)
    const limited = addProduct(doc, { edition_type: 'limited' })
    const bd = addDisc(doc, { format: 'bd' })
    expect(regular.disc_ids).toEqual([disc.id, bd.id])
    regular.disc_ids = [disc.id]
    expect(untickedDiscs(doc)).toEqual([])
    removeProduct(doc, limited.id)
    expect(regular.disc_ids).toEqual([disc.id, bd.id])
  })

  it('takes bonus discs out of editions and puts them back when the bonus goes', () => {
    const { doc } = album()
    const product = addProduct(doc)
    const bonus = addBonus(doc, { name: 'Shop CD', type: 'bonus_disc', product_ids: [product.id] })
    const extra = addDisc(doc, { bonus_id: bonus.id })
    expect(product.disc_ids).not.toContain(extra.id)
    setDiscBonus(doc, extra.id, null)
    expect(product.disc_ids).toContain(extra.id)
    setDiscBonus(doc, extra.id, bonus.id)
    removeBonus(doc, bonus.id)
    expect(extra.bonus_id).toBeNull()
    expect(product.disc_ids).toContain(extra.id)
  })

  it('has one unscoped cover', () => {
    const { doc } = album()
    doc.images.push({ id: 'g', image_id: 5, kind: 'back', label: null, caption: null, product_id: null, bonus_id: null, disc_id: null, sort_order: 0 })
    setCover(doc, 7)
    setCover(doc, 8)
    expect(coverOf(doc)?.image_id).toBe(8)
    expect(doc.images.map(image => [image.kind, image.sort_order])).toEqual([['back', 1], ['cover', 0]])
  })
})

describe('credits', () => {
  it('groups rows and edits them together', () => {
    const { doc } = album()
    const [a, b, c] = orderedTracks(doc)
    addCredit(doc, { artist_id: 3, credited_as: null, role: 'composer', detail: null }, [a!.id, b!.id])
    addCredit(doc, { artist_id: 3, credited_as: null, role: 'lyricist', detail: null }, [a!.id])
    let groups = creditGroups(doc)
    expect(groups.map(group => [group.role, group.trackIds.length])).toEqual([['composer', 2], ['lyricist', 1]])

    setCreditTracks(doc, groups[0]!, [b!.id, c!.id])
    groups = creditGroups(doc)
    expect(groups[0]!.trackIds).toEqual([b!.id, c!.id])

    updateCreditGroup(doc, groups[1]!, { role: 'composer' })
    expect(creditGroups(doc).map(group => [group.role, group.trackIds.length])).toEqual([['composer', 3]])

    setCreditScope(doc, creditGroups(doc)[0]!, true)
    expect(doc.credits.map(credit => credit.track_id)).toEqual([null])
  })
})

describe('names and checks', () => {
  it('sets names per language and prunes blank ones', () => {
    const { doc, disc } = album()
    const track = tracksOn(doc, disc.id)[0]!
    setTitleIn(doc, 'track_titles', { field: 'track_id', id: track.id }, 'en', 'translation', 'A in English')
    setTitleIn(doc, 'titles', null, 'en', 'translation', 'Album')
    expect(titleIn(doc, 'track_titles', { field: 'track_id', id: track.id }, 'en', 'translation')).toBe('A in English')
    setTitleIn(doc, 'titles', null, 'en', 'translation', '  ')
    expect(doc.titles).toHaveLength(1)
    expect(pruneAlbumDocument(doc).titles).toEqual([])
    expect(pruneAlbumDocument(doc).track_titles).toHaveLength(1)
  })

  it('upgrades drafts kept from before 原曲 moved to tracks', () => {
    const { doc, disc } = album()
    const draft = doc as typeof doc & { track_originals?: unknown }
    delete draft.track_originals
    Object.assign(tracksOn(doc, disc.id)[0]!, { work_id: 3 })
    upgradeAlbumDocument(doc)
    expect(doc.track_originals).toEqual([])
    expect('work_id' in tracksOn(doc, disc.id)[0]!).toBe(false)
    doc.track_originals.push({ id: 'o1', track_id: tracksOn(doc, disc.id)[0]!.id, original_track_id: null, original_title: ' ' })
    expect(pruneAlbumDocument(doc).track_originals).toEqual([])
  })

  it('lists the missing required fields', () => {
    const doc = emptyAlbumDocument()
    expect(missingRequired(doc)).toEqual(['title', 'type', 'release_date', 'cover', 'tracks'])
    doc.title = 'X'
    doc.type = 'album'
    doc.release_date = '2024-01-01'
    setCover(doc, 1)
    addTrack(doc, doc.discs[0]!.id, { title: 'A' })
    expect(missingRequired(doc)).toEqual([])
  })
})
