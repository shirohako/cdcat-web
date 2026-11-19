import { describe, expect, it } from 'vitest'
import { shareUrl, type SharePage } from '../../app/utils/shareTargets'

const page: SharePage = {
  url: 'https://cdcat.net/albums/138?lang=zh-Hans',
  title: 'マウカリタ - LUNA*RUMA',
  description: 'LUNA*RUMA 的专辑，2010年10月31日发行。',
  image: 'https://img.cdcat.net/covers/138.webp',
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

  it('gives QQ the title, the summary and the square picture', () => {
    const address = shareUrl('qq', page)
    expect(address.startsWith('https://connect.qq.com/widget/shareqq/index.html?')).toBe(true)
    expect(params(address)).toEqual({ url: page.url, title: page.title, summary: page.description, pics: page.image, site: 'CDCat' })
  })

  it('cuts a long summary and leaves out what is missing', () => {
    const address = shareUrl('qq', { url: page.url, title: page.title, description: '长'.repeat(200), image: null })
    const sent = params(address)
    expect([...sent.summary!].length).toBeLessThanOrEqual(80)
    expect(sent.summary!.endsWith('…')).toBe(true)
    expect(sent).not.toHaveProperty('pics')
  })
})
