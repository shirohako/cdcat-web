import { describe, expect, it } from 'vitest'
import { itemEntries, itemUrls, pageEntries, parseSitemapFile, sitemapFiles, sitemapXml, SITEMAP_PAGES, SITEMAP_PAGES_SINGLE } from '../../server/utils/sitemap'
import { indexNowBodies, INDEXNOW_BATCH } from '../../server/utils/indexnow'

const BASE = 'https://cdcat.net'

describe('sitemap files', () => {
  it('gives a chunk a file per language when its pages have versions, one file otherwise', () => {
    expect(sitemapFiles('albums-1', true)).toEqual(['albums-1.xml', 'albums-1.en.xml', 'albums-1.zh-Hans.xml', 'albums-1.zh-Hant.xml', 'albums-1.ko.xml'])
    expect(sitemapFiles('topics-1', false)).toEqual(['topics-1.xml'])
  })

  it('reads what a file name asks for', () => {
    expect(parseSitemapFile('pages.xml')).toEqual({ type: 'pages', page: 1, locale: 'ja' })
    expect(parseSitemapFile('pages.ko.xml')).toEqual({ type: 'pages', page: 1, locale: 'ko' })
    expect(parseSitemapFile('albums-2.xml')).toEqual({ type: 'albums', page: 2, locale: 'ja' })
    expect(parseSitemapFile('event-series-1.zh-Hans.xml')).toEqual({ type: 'event-series', page: 1, locale: 'zh-Hans' })
  })

  it('refuses unknown types, languages and pages, and language files of single-address types', () => {
    for (const file of ['labels-1.xml', 'albums-0.xml', 'albums-1.fr.xml', 'albums-1.ja.xml', 'albums.xml', 'topics-1.en.xml', 'profiles-1.ko.xml', '../x.xml']) {
      expect(parseSitemapFile(file)).toBeNull()
    }
  })
})

describe('sitemap entries', () => {
  it('lists the fixed pages in each language, and the single-address ones once', () => {
    const bare = pageEntries(BASE, 'ja').map(entry => entry.loc)
    expect(bare).toContain('https://cdcat.net/')
    expect(bare).toContain('https://cdcat.net/join')
    expect(bare).not.toContain('https://cdcat.net/labels')
    expect(bare).toHaveLength(SITEMAP_PAGES.length + SITEMAP_PAGES_SINGLE.length)
    const english = pageEntries(BASE, 'en').map(entry => entry.loc)
    expect(english).toContain('https://cdcat.net/?lang=en')
    expect(english).toContain('https://cdcat.net/albums?lang=en')
    expect(english).toHaveLength(SITEMAP_PAGES.length)
  })

  it('addresses each type, with images on the bare addresses only', () => {
    const items = [{ id: 7, image: 'https://img.cdcat.net/a.webp', updated_at: '2026-11-01T00:00:00Z' }]
    expect(itemEntries('albums', items, BASE, 'ja')).toEqual([{ loc: 'https://cdcat.net/albums/7', lastmod: '2026-11-01T00:00:00Z', image: 'https://img.cdcat.net/a.webp' }])
    expect(itemEntries('albums', items, BASE, 'en')).toEqual([{ loc: 'https://cdcat.net/albums/7?lang=en', lastmod: '2026-11-01T00:00:00Z', image: null }])
    expect(itemEntries('profiles', [{ id: 1, username: 'a b', updated_at: null }], BASE, 'ja')[0]!.loc).toBe('https://cdcat.net/profile/a%20b')
    expect(itemEntries('articles', [{ id: 3, slug: '新譜', updated_at: null }], BASE, 'ja')[0]!.loc).toBe('https://cdcat.net/articles/3/%E6%96%B0%E8%AD%9C')
    expect(itemEntries('labels', items, BASE, 'ja')).toEqual([])
  })

  it('gives IndexNow every language version of a page, and one address for members\' writing', () => {
    expect(itemUrls('albums', [{ id: 7, updated_at: null }], BASE)).toEqual([
      'https://cdcat.net/albums/7', 'https://cdcat.net/albums/7?lang=en', 'https://cdcat.net/albums/7?lang=zh-Hans',
      'https://cdcat.net/albums/7?lang=zh-Hant', 'https://cdcat.net/albums/7?lang=ko',
    ])
    expect(itemUrls('topics', [{ id: 9, updated_at: null }], BASE)).toEqual(['https://cdcat.net/discussions/9'])
  })
})

describe('sitemapXml', () => {
  it('escapes addresses and adds the image namespace only when a page has a picture', () => {
    const plain = sitemapXml('urlset', [{ loc: 'https://cdcat.net/albums?page=2&lang=en', lastmod: '2026-11-01T00:00:00Z' }])
    expect(plain).toContain('<loc>https://cdcat.net/albums?page=2&amp;lang=en</loc><lastmod>2026-11-01T00:00:00Z</lastmod>')
    expect(plain).not.toContain('xmlns:image')
    const pictured = sitemapXml('urlset', [{ loc: 'https://cdcat.net/albums/7', image: 'https://img.cdcat.net/a.webp' }, { loc: 'https://cdcat.net/albums/8' }])
    expect(pictured).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
    expect(pictured).toContain('<url><loc>https://cdcat.net/albums/7</loc><image:image><image:loc>https://img.cdcat.net/a.webp</image:loc></image:image></url>')
    expect(pictured).toContain('<url><loc>https://cdcat.net/albums/8</loc></url>')
  })

  it('writes an index of files', () => {
    expect(sitemapXml('sitemapindex', [{ loc: 'https://cdcat.net/sitemaps/pages.xml' }])).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<sitemap><loc>https://cdcat.net/sitemaps/pages.xml</loc></sitemap>')
  })
})

describe('indexNowBodies', () => {
  it('names the host, the key and where to check it, once per address', () => {
    expect(indexNowBodies('https://cdcat.net/', 'abc123', ['https://cdcat.net/albums/7', 'https://cdcat.net/albums/7', 'https://cdcat.net/albums/8'])).toEqual([
      { host: 'cdcat.net', key: 'abc123', keyLocation: 'https://cdcat.net/indexnow-key.txt', urlList: ['https://cdcat.net/albums/7', 'https://cdcat.net/albums/8'] },
    ])
  })

  it('sends nothing for nothing, and splits long lists', () => {
    expect(indexNowBodies(BASE, 'k', [])).toEqual([])
    const many = Array.from({ length: INDEXNOW_BATCH + 1 }, (_, index) => `${BASE}/albums/${index}`)
    expect(indexNowBodies(BASE, 'k', many).map(body => body.urlList.length)).toEqual([INDEXNOW_BATCH, 1])
  })
})
