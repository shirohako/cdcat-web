import { describe, expect, it } from 'vitest'
import { createPageCache } from '../../app/utils/pageCache'

const clock = (start = 0) => {
  let time = start
  return { now: () => time, advance: (ms: number) => { time += ms } }
}

describe('page cache', () => {
  it('treats data as fresh for the same user until it is too old', () => {
    const time = clock()
    const cache = createPageCache({ maxAge: 1000, now: time.now })
    cache.touch('a', 1)
    expect(cache.isFresh('a', 1)).toBe(true)
    expect(cache.isFresh('a', 2)).toBe(false)
    expect(cache.isFresh('a', null)).toBe(false)
    time.advance(999)
    expect(cache.isFresh('a', 1)).toBe(true)
    time.advance(1)
    expect(cache.isFresh('a', 1)).toBe(false)
  })

  it('knows nothing about keys it was never told about', () => {
    const cache = createPageCache()
    expect(cache.isFresh('missing', null)).toBe(false)
  })

  it('drops the least recently fetched keys beyond the limit', () => {
    const cache = createPageCache({ maxEntries: 2 })
    expect(cache.touch('a', null)).toEqual([])
    expect(cache.touch('b', null)).toEqual([])
    cache.touch('a', null)
    expect(cache.touch('c', null)).toEqual(['b'])
    expect(cache.isFresh('b', null)).toBe(false)
    expect(cache.isFresh('a', null)).toBe(true)
    expect(cache.isFresh('c', null)).toBe(true)
  })

  it('never drops a key a mounted page is using', () => {
    const cache = createPageCache({ maxEntries: 1 })
    cache.touch('a', null)
    cache.retain('a')
    expect(cache.touch('b', null)).toEqual(['b'])
    expect(cache.isFresh('a', null)).toBe(true)
    cache.release('a')
    expect(cache.touch('c', null)).toEqual(['a'])
  })

  it('counts every page using a key before letting it go', () => {
    const cache = createPageCache({ maxEntries: 1 })
    cache.touch('a', null)
    cache.retain('a')
    cache.retain('a')
    cache.release('a')
    expect(cache.touch('b', null)).toEqual(['b'])
    cache.release('a')
    expect(cache.touch('c', null)).toEqual(['a'])
  })
})
