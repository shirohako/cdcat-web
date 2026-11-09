import { describe, expect, it } from 'vitest'
import { canonicalLinkUrl, linkCategoryKey, linkHost, linkName, linkTileHue, providerHue, splitUrl } from '../../app/utils/linkProviders'

describe('linkName', () => {
  const provider = { name: 'TANO*C STORE' }

  it('prefers the name the link was given', () => {
    expect(linkName({ url: 'https://store.tano-c.net/products/1', label: '限定版特典', provider })).toBe('限定版特典')
  })

  it('falls back to the site, then the host', () => {
    expect(linkName({ url: 'https://store.tano-c.net/products/1', label: null, provider })).toBe('TANO*C STORE')
    expect(linkName({ url: 'https://store.tano-c.net/products/1', label: '  ', provider })).toBe('TANO*C STORE')
    expect(linkName({ url: 'https://www.example.com/a', label: null, provider: null })).toBe('example.com')
  })

  it('shows an address it cannot read as written', () => {
    expect(linkName({ url: 'not a url', provider: null })).toBe('not a url')
  })
})

describe('linkHost', () => {
  it('drops www. only at the start', () => {
    expect(linkHost('https://www.vgmdb.net/album/1')).toBe('vgmdb.net')
    expect(linkHost('https://shop.www.example.com/')).toBe('shop.www.example.com')
  })
})

describe('splitUrl', () => {
  it('cuts the scheme, the host and the rest as written', () => {
    expect(splitUrl('https://store.tano-c.net/products/abc?x=1#top')).toEqual({ scheme: 'https://', host: 'store.tano-c.net', rest: '/products/abc?x=1#top' })
    expect(splitUrl('HTTP://Example.com')).toEqual({ scheme: 'HTTP://', host: 'Example.com', rest: '' })
    expect(splitUrl('https://example.com?q=1')).toEqual({ scheme: 'https://', host: 'example.com', rest: '?q=1' })
  })

  it('keeps a user name and a port in the host, so they show', () => {
    expect(splitUrl('https://paypal.com@evil.example:8080/login')).toEqual({ scheme: 'https://', host: 'paypal.com@evil.example:8080', rest: '/login' })
  })

  it('leaves anything else whole', () => {
    expect(splitUrl('mailto:support@cdcat.net')).toEqual({ scheme: '', host: '', rest: 'mailto:support@cdcat.net' })
    expect(splitUrl('not a url')).toEqual({ scheme: '', host: '', rest: 'not a url' })
  })
})

describe('link tiles', () => {
  it('counts unknown categories as other', () => {
    expect(linkCategoryKey('shop')).toBe('shop')
    expect(linkCategoryKey('lyrics')).toBe('other')
    expect(linkCategoryKey(null)).toBe('other')
  })

  it('tints only links of a known site', () => {
    expect(linkTileHue('database', 'vgmdb')).toBe(providerHue('vgmdb'))
    expect(linkTileHue('other', 'kickstarter')).toBeNull()
    expect(linkTileHue('shop', null)).toBeNull()
    expect(linkTileHue(undefined, 'vgmdb')).toBeNull()
  })
})

describe('canonicalLinkUrl', () => {
  it('turns BOOTH items on booth.pm into the Japanese page', () => {
    expect(canonicalLinkUrl('https://booth.pm/zh-cn/items/8034195')).toBe('https://booth.pm/ja/items/8034195')
    expect(canonicalLinkUrl(' http://www.booth.pm/en/items/8034195?a=1 ')).toBe('https://booth.pm/ja/items/8034195')
    expect(canonicalLinkUrl('https://booth.pm/items/8034195')).toBe('https://booth.pm/ja/items/8034195')
  })

  it('leaves shop addresses and other links alone', () => {
    expect(canonicalLinkUrl('https://hagall.booth.pm/items/8034195')).toBe('https://hagall.booth.pm/items/8034195')
    expect(canonicalLinkUrl('https://booth.pm/ja/events/m3-2026s')).toBe('https://booth.pm/ja/events/m3-2026s')
    expect(canonicalLinkUrl('https://vgmdb.net/album/1')).toBe('https://vgmdb.net/album/1')
  })
})
