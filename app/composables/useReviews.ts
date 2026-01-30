/**
 * 评价管理 Composable
 * 提供专辑评价的获取、创建、编辑、删除等功能
 */

import type {
  UserReview,
  ReviewArtist,
  ReviewStats,
  ReviewSortBy,
  GetReviewsResponse,
  SearchableAlbum,
  CreateReviewRequest,
  UpdateReviewRequest
} from '~/types/reviews'

// ==================== Mock 可搜索专辑 ====================
const mockAlbums: SearchableAlbum[] = [
  {
    id: 1001,
    title: 'Wish You Were Here',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 101, name: 'Pink Floyd' }],
    releaseDate: '1975-09-15',
    catalogNumber: 'SHVL-814'
  },
  {
    id: 1002,
    title: 'The Dark Side of the Moon',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 101, name: 'Pink Floyd' }],
    releaseDate: '1973-03-01',
    catalogNumber: 'SHVL-804'
  },
  {
    id: 1003,
    title: 'The Wall',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 101, name: 'Pink Floyd' }],
    releaseDate: '1979-11-30',
    catalogNumber: 'SHVL-411'
  },
  {
    id: 1004,
    title: 'Abbey Road',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 102, name: 'The Beatles' }],
    releaseDate: '1969-09-26',
    catalogNumber: 'PCS-7088'
  },
  {
    id: 1005,
    title: 'Rumours',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 103, name: 'Fleetwood Mac' }],
    releaseDate: '1977-02-04',
    catalogNumber: 'K50364'
  },
  {
    id: 2001,
    title: 'OK Computer',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 104, name: 'Radiohead' }],
    releaseDate: '1997-06-16',
    catalogNumber: 'CXDM-2010'
  },
  {
    id: 2002,
    title: 'In Rainbows',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 104, name: 'Radiohead' }],
    releaseDate: '2007-10-10',
    catalogNumber: 'XLS-158'
  },
  {
    id: 2003,
    title: 'A Moon Shaped Pool',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 104, name: 'Radiohead' }],
    releaseDate: '2016-05-08',
    catalogNumber: 'XLS-208'
  },
  {
    id: 3001,
    title: 'Nevermind',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 105, name: 'Nirvana' }],
    releaseDate: '1991-09-24',
    catalogNumber: 'DGC-24425'
  },
  {
    id: 3002,
    title: 'In Utero',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 105, name: 'Nirvana' }],
    releaseDate: '1993-09-21',
    catalogNumber: 'DGC-24536'
  },
  {
    id: 4001,
    title: 'Led Zeppelin IV',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 106, name: 'Led Zeppelin' }],
    releaseDate: '1971-11-08',
    catalogNumber: 'Atlantic SD 7208'
  },
  {
    id: 5001,
    title: 'Blue',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 107, name: 'Joni Mitchell' }],
    releaseDate: '1971-06-22',
    catalogNumber: 'R-2038'
  },
  {
    id: 5002,
    title: 'Kind of Blue',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 108, name: 'Miles Davis' }],
    releaseDate: '1959-08-17',
    catalogNumber: 'CL-1355'
  },
  {
    id: 5003,
    title: 'Loveless',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 109, name: 'My Bloody Valentine' }],
    releaseDate: '1991-11-04',
    catalogNumber: 'CRE-LP-060'
  },
  {
    id: 5004,
    title: 'Remain in Light',
    imageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 110, name: 'Talking Heads' }],
    releaseDate: '1980-10-08',
    catalogNumber: 'SRK-6095'
  }
]

// ==================== Mock 评价数据 ====================
let mockReviews: UserReview[] = [
  {
    id: 1,
    workId: 2001,
    workTitle: 'OK Computer',
    workImageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 104, name: 'Radiohead' }],

    content: '这张专辑在 1997 年彻底颠覆了人们对摇滚乐的认知。从开场的《Airbag》到结尾的《The Tourist》，每一首歌都像是对现代科技社会的深刻反思。Thom Yorke 的声音既脆弱又充满力量，电子元素与吉他的融合完美无缝。这不仅是 Radiohead 最好的专辑，也是整个 90 年代最重要的音乐作品之一。',
    score: 9,
    reactions: { helpful: 42, unhelpful: 3, funny: 5 },
    createdAt: '2025-12-15T10:30:00Z',
    updatedAt: '2025-12-15T10:30:00Z'
  },
  {
    id: 2,
    workId: 1002,
    workTitle: 'The Dark Side of the Moon',
    workImageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 101, name: 'Pink Floyd' }],

    content: '概念专辑的巅峰之作。整张专辑如同一部交响乐，从头到尾一气呵成。音效设计在当时绝对是超前的，至今听来依旧震撼。《Time》和《Money》是永恒的经典。',
    score: 10,
    reactions: { helpful: 87, unhelpful: 2, funny: 12 },
    createdAt: '2025-12-10T14:20:00Z',
    updatedAt: '2025-12-10T14:20:00Z'
  },
  {
    id: 3,
    workId: 3001,
    workTitle: 'Nevermind',
    workImageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 105, name: 'Nirvana' }],

    content: 'Kurt Cobain 用最直接的方式表达了一代人的愤怒和迷茫。《Smells Like Teen Spirit》的开场 riff 足以改变整个音乐产业的方向。虽然后来的《In Utero》更加生猛，但这张专辑的流行性和影响力无可替代。',
    score: 8,
    reactions: { helpful: 31, unhelpful: 5, funny: 2 },
    createdAt: '2025-11-28T09:15:00Z',
    updatedAt: '2025-11-28T09:15:00Z'
  },
  {
    id: 4,
    workId: 2002,
    workTitle: 'In Rainbows',
    workImageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 104, name: 'Radiohead' }],

    content: 'Radiohead 最感性的专辑。《Reckoner》可能是他们写过的最美的歌，而《15 Step》的 5/4 拍子开场让人耳目一新。自主定价的发行方式也开创了音乐行业的新模式。每一次重听都能发现新的细节。',
    score: 9,
    reactions: { helpful: 56, unhelpful: 1, funny: 8 },
    createdAt: '2025-11-20T16:45:00Z',
    updatedAt: '2025-12-01T08:00:00Z'
  },
  {
    id: 5,
    workId: 5002,
    workTitle: 'Kind of Blue',
    workImageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 108, name: 'Miles Davis' }],

    content: '爵士乐入门的完美之选。旋律优美，氛围感十足，适合任何时候聆听。Miles Davis 的小号音色干净而富有情感。虽然不是爵士乐的重度爱好者，但这张专辑让我开始理解爵士乐的魅力所在。',
    score: null,
    reactions: { helpful: 15, unhelpful: 0, funny: 1 },
    createdAt: '2025-11-15T20:00:00Z',
    updatedAt: '2025-11-15T20:00:00Z'
  },
  {
    id: 6,
    workId: 1004,
    workTitle: 'Abbey Road',
    workImageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 102, name: 'The Beatles' }],

    content: 'B 面的 Medley 是流行音乐史上最伟大的段落之一。四位成员各自发挥到了极致，George Harrison 的《Something》和《Here Comes the Sun》证明他完全不逊色于 Lennon-McCartney 组合。这是一个乐队在解散前最美好的告别。',
    score: 8,
    reactions: { helpful: 24, unhelpful: 4, funny: 0 },
    createdAt: '2025-10-30T11:30:00Z',
    updatedAt: '2025-10-30T11:30:00Z'
  },
  {
    id: 7,
    workId: 5003,
    workTitle: 'Loveless',
    workImageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 109, name: 'My Bloody Valentine' }],

    content: '第一次听的时候完全不知道该怎么评价。失真的吉他墙、模糊的人声、不断涌动的噪音……这不像是音乐，更像是一种体验。Kevin Shields 花了两年时间和 25 万英镑制作这张专辑，每一分钱都花在了声音的极致追求上。随着听的次数增加，你会逐渐沉浸在那个梦幻般的声音世界里，再也不想出来。这是自赏音乐的代名词。',
    score: 7,
    reactions: { helpful: 19, unhelpful: 6, funny: 3 },
    createdAt: '2025-10-15T18:00:00Z',
    updatedAt: '2025-10-15T18:00:00Z'
  },
  {
    id: 8,
    workId: 5004,
    workTitle: 'Remain in Light',
    workImageUrl: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    artists: [{ id: 110, name: 'Talking Heads' }],

    content: '非洲节拍与后朋克的完美融合。Brian Eno 的制作让这张专辑的声音层次极其丰富。《Once in a Lifetime》至今仍是我的 playlist 常客。',
    score: null,
    reactions: { helpful: 8, unhelpful: 1, funny: 22 },
    createdAt: '2025-09-25T13:00:00Z',
    updatedAt: '2025-09-25T13:00:00Z'
  }
]

// ==================== 统计函数 ====================
const calculateStats = (reviews: UserReview[]): ReviewStats => {
  const scored = reviews.filter(r => r.score !== null)
  return {
    totalReviews: reviews.length,
    averageScore: scored.length > 0
      ? scored.reduce((sum, r) => sum + r.score!, 0) / scored.length
      : 0,
    scoredCount: scored.length
  }
}

// ==================== Composable ====================
export const useReviews = () => {
  /**
   * 获取评价列表（分页 + 排序）
   */
  const getReviews = async (
    page: number = 1,
    pageSize: number = 10,
    sortBy: ReviewSortBy = 'date_desc'
  ): Promise<GetReviewsResponse> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    let sorted = [...mockReviews]
    switch (sortBy) {
      case 'date_desc':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'date_asc':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'score_desc':
        sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        break
      case 'score_asc':
        sorted.sort((a, b) => (a.score ?? 11) - (b.score ?? 11))
        break
    }

    const start = (page - 1) * pageSize
    return {
      data: sorted.slice(start, start + pageSize),
      total: sorted.length,
      page,
      pageSize
    }
  }

  /**
   * 获取评价统计
   */
  const getReviewStats = async (): Promise<ReviewStats> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return calculateStats(mockReviews)
  }

  /**
   * 搜索专辑（写评价模态框用）
   */
  const searchAlbums = async (query: string): Promise<SearchableAlbum[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    if (!query.trim()) return mockAlbums.slice(0, 5)
    const q = query.toLowerCase()
    return mockAlbums.filter(a =>
      a.title.toLowerCase().includes(q)
      || a.artists.some(ar => ar.name.toLowerCase().includes(q))
      || a.catalogNumber.toLowerCase().includes(q)
    )
  }

  /**
   * 创建评价
   */
  const createReview = async (req: CreateReviewRequest): Promise<UserReview> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const album = mockAlbums.find(a => a.id === req.workId)
    const now = new Date().toISOString()
    const newReview: UserReview = {
      id: Math.floor(Math.random() * 100000),
      workId: req.workId,
      workTitle: album?.title ?? '未知专辑',
      workImageUrl: album?.imageUrl ?? '',
      artists: album?.artists ?? [],
      content: req.content,
      score: req.score,
      reactions: { helpful: 0, unhelpful: 0, funny: 0 },
      createdAt: now,
      updatedAt: now
    }
    mockReviews.unshift(newReview)
    return newReview
  }

  /**
   * 更新评价
   */
  const updateReview = async (req: UpdateReviewRequest): Promise<UserReview> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const review = mockReviews.find(r => r.id === req.reviewId)
    if (review) {
      review.content = req.content
      review.score = req.score
      review.updatedAt = new Date().toISOString()
    }
    return review!
  }

  /**
   * 删除评价
   */
  const deleteReview = async (reviewId: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = mockReviews.findIndex(r => r.id === reviewId)
    if (index > -1) {
      mockReviews.splice(index, 1)
      return true
    }
    return false
  }

  return {
    getReviews,
    getReviewStats,
    searchAlbums,
    createReview,
    updateReview,
    deleteReview
  }
}
