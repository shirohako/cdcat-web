import { describe, expect, it } from 'vitest'
import { fillRequiredText } from '../../app/utils/requiredText'

const album = {
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'slug', type: 'string' },
    { name: 'type', type: 'enum', required: true },
  ],
  collections: [
    { name: 'tracks', kind: 'owned', fields: [{ name: 'title', type: 'string', required: true }, { name: 'isrc', type: 'string' }] },
    { name: 'links', kind: 'owned', fields: [{ name: 'url', type: 'url', required: true }] },
  ],
}

describe('fillRequiredText', () => {
  it('turns nulls in required text fields into empty strings and leaves the rest alone', () => {
    const doc = fillRequiredText({
      title: null, slug: null, type: null,
      tracks: [{ id: 't1', title: null, isrc: null }, { id: 't2', title: 'B', isrc: null }],
      links: [],
    }, album)
    expect(doc).toEqual({
      title: '', slug: null, type: null,
      tracks: [{ id: 't1', title: '', isrc: null }, { id: 't2', title: 'B', isrc: null }],
      links: [],
    })
  })

  it('copes with collections missing from the document', () => {
    expect(fillRequiredText({ title: 'A' }, album)).toEqual({ title: 'A' })
  })
})
