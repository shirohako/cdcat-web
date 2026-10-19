import { describe, expect, it } from 'vitest'
import type { EventCircle, VenueMapData } from '../../app/types/event'
import { buildSpaces, circleVideos } from '../../app/utils/eventVenue'

const link = (url: string) => ({ type: 'sns', url })

describe('circleVideos', () => {
  it('turns embeds and single-video links into cards opening the original site', () => {
    const videos = circleVideos({
      embeds: [{ type: 'youtube', id: 'dQw4w9WgXcQ' }],
      links: [
        link('https://youtu.be/dQw4w9WgXcQ'), // same video as the embed
        link('https://www.youtube.com/watch?v=abcdefghijk&t=10'),
        link('https://youtube.com/shorts/Shorts12345'),
        link('https://www.youtube.com/@channel'), // a channel, not a video
        link('https://youtube.com/playlist?list=PL123'),
        link('https://www.nicovideo.jp/watch/sm12345678'),
        link('https://www.nicovideo.jp/user/1'),
        link('not a url'),
      ],
    })
    expect(videos.map(v => v.url)).toEqual([
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=abcdefghijk',
      'https://www.youtube.com/watch?v=Shorts12345',
      'https://www.nicovideo.jp/watch/sm12345678',
    ])
    expect(videos[0]!.thumbnail).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    expect(videos[3]!.thumbnail).toBeNull()
  })
})

describe('buildSpaces', () => {
  const circle = (id: number, sub: string | null): EventCircle => ({
    id, space_id: 1, space_code: null, area: 'A', sub, name: `c${id}`, name_kana: null, description: null, genre: null,
    keywords: [], links: [], twitter_handle: null, image_url: null, embeds: [], is_adult: false, artist: null, album_ids: [],
  })
  const map = { spaces: [[1, 1, 'A', '01', 0, 0, 10, 6]] } as unknown as VenueMapData

  it('cuts a desk along its longer side and leaves a half nobody took empty', () => {
    const [space] = buildSpaces(map, [circle(7, 'b')])
    expect(space!.pieces.map(p => [p.x, p.w, p.circle?.id ?? null])).toEqual([[0, 5, null], [5, 5, 7]])
  })

  it('gives a whole desk to an ab circle and thirds to mini spaces', () => {
    expect(buildSpaces(map, [circle(1, 'ab')])[0]!.pieces).toHaveLength(1)
    expect(buildSpaces(map, [circle(1, 'x'), circle(2, 'z')])[0]!.pieces.map(p => p.circle?.id ?? null)).toEqual([1, null, 2])
  })
})
