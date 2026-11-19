import { describe, expect, it } from 'vitest'
import { shareUrl, type SharePage } from '../../app/utils/shareTargets'

const page: SharePage = {
  url: 'https://cdcat.net/albums/138?lang=zh-Hans',
  title: 'マウカリタ - LUNA*RUMA',
}

const params = (address: string) => Object.fromEntries(new URL(address).searchParams)

describe('shareUrl', () => {
  it('posts the title and the address to X', () => {
    const address = shareUrl('x', page)
    expect(address.startsWith('https://x.com/intent/tweet?')).toBe(true)
    expect(params(address)).toEqual({ text: page.title, url: page.url })
  })

  it('percent-encodes spaces instead of writing +', () => {
    expect(shareUrl('x', page)).toContain('text=%E3%83%9E%E3%82%A6%E3%82%AB%E3%83%AA%E3%82%BF%20-%20LUNA*RUMA')
  })

  it('gives LINE the address only', () => {
    const address = shareUrl('line', page)
    expect(address.startsWith('https://social-plugins.line.me/lineit/share?')).toBe(true)
    expect(params(address)).toEqual({ url: page.url })
  })

  it('leaves out an empty title', () => {
    expect(params(shareUrl('x', { url: page.url, title: '' }))).toEqual({ url: page.url })
  })
})
