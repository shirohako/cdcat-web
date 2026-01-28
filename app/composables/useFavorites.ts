/**
 * 收藏管理 Composable
 * 提供获取、添加、删除收藏等功能
 */

import type {
  FavoriteWork,
  FavoriteSong,
  FavoriteArtist,
  FavoritesStats,
  GetFavoritesResponse,
  CheckFavoriteResponse
} from '~/types/favorites'

// Mock 数据
const mockFavoriteWorks: FavoriteWork[] = [
  {
    id: 1,
    workId: 101,
    workTitle: 'Demon Slayer Season 1',
    artists: ['Yuki Kajiura'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2019-04-06',
    createdAt: '2024-01-01'
  },
  {
    id: 2,
    workId: 102,
    workTitle: 'Attack on Titan Season 4',
    artists: ['Hiroyuki Sawano'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2020-12-07',
    createdAt: '2024-01-02'
  },
  {
    id: 3,
    workId: 103,
    workTitle: 'Jujutsu Kaisen',
    artists: ['Yoshimasa Terui'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2020-10-02',
    createdAt: '2024-01-03'
  },
  {
    id: 4,
    workId: 104,
    workTitle: 'Your Name',
    artists: ['RADWIMPS'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2016-04-22',
    createdAt: '2024-01-04'
  },
  {
    id: 5,
    workId: 105,
    workTitle: 'Steins;Gate',
    artists: ['Takeshi Abo'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2011-04-09',
    createdAt: '2024-01-05'
  },
  {
    id: 6,
    workId: 106,
    workTitle: 'Naruto Shippuden',
    artists: ['Toshiro Masuda', 'Yasuori Yoda'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2007-02-15',
    createdAt: '2024-01-06'
  },
  {
    id: 7,
    workId: 107,
    workTitle: 'Mob Psycho 100',
    artists: ['Kenji Kawai'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2016-07-12',
    createdAt: '2024-01-07'
  },
  {
    id: 8,
    workId: 108,
    workTitle: 'Death Note',
    artists: ['Hideki Taniuchi', 'Yoshihiro Ike'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2006-10-03',
    createdAt: '2024-01-08'
  },
  {
    id: 9,
    workId: 109,
    workTitle: 'Fullmetal Alchemist',
    artists: ['Michiru Oshima'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2005-04-06',
    createdAt: '2024-01-09'
  },
  {
    id: 10,
    workId: 110,
    workTitle: 'Code Geass',
    artists: ['Hitomi Kuroishi', 'Kotaro Nakagawa'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2006-10-05',
    createdAt: '2024-01-10'
  },
  {
    id: 11,
    workId: 111,
    workTitle: 'Sword Art Online',
    artists: ['Yuki Kajiura'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2012-07-07',
    createdAt: '2024-01-11'
  },
  {
    id: 12,
    workId: 112,
    workTitle: 'Tokyo Ghoul',
    artists: ['Yutaka Yamada'],
    cover: 'https://images.unsplash.com/photo-1578849278619-3f4ee293583d?w=200',
    releaseDate: '2014-07-04',
    createdAt: '2024-01-12'
  }
]

const mockFavoriteSongs: FavoriteSong[] = [
  {
    id: 1,
    songId: 201,
    songTitle: 'Gurenge',
    artist: 'LiSA',
    workTitle: 'Demon Slayer',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 256,
    createdAt: '2024-01-01'
  },
  {
    id: 2,
    songId: 202,
    songTitle: 'Red Swan',
    artist: 'Yoshiki',
    workTitle: 'Attack on Titan',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 240,
    createdAt: '2024-01-02'
  },
  {
    id: 3,
    songId: 203,
    songTitle: 'Lost in Paradise',
    artist: 'ALI',
    workTitle: 'Jujutsu Kaisen',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 252,
    createdAt: '2024-01-03'
  },
  {
    id: 4,
    songId: 204,
    songTitle: 'Kaikai Kitan',
    artist: 'Eve',
    workTitle: 'Jujutsu Kaisen',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 244,
    createdAt: '2024-01-04'
  },
  {
    id: 5,
    songId: 205,
    songTitle: 'Nandemonaiya',
    artist: 'RADWIMPS',
    workTitle: 'Your Name',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 303,
    createdAt: '2024-01-05'
  },
  {
    id: 6,
    songId: 206,
    songTitle: 'Fatima',
    artist: 'RADWIMPS',
    workTitle: 'Your Name',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 281,
    createdAt: '2024-01-06'
  },
  {
    id: 7,
    songId: 207,
    songTitle: 'Skyclad Observer',
    artist: 'Genius Nanoha',
    workTitle: 'Steins;Gate',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 225,
    createdAt: '2024-01-07'
  },
  {
    id: 8,
    songId: 208,
    songTitle: 'Blue Bird',
    artist: '青木カレン',
    workTitle: 'Naruto Shippuden',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 246,
    createdAt: '2024-01-08'
  },
  {
    id: 9,
    songId: 209,
    songTitle: 'The Hero',
    artist: 'Brian the Sun',
    workTitle: 'Mob Psycho 100',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 268,
    createdAt: '2024-01-09'
  },
  {
    id: 10,
    songId: 210,
    songTitle: 'The World',
    artist: 'Nightmare',
    workTitle: 'Death Note',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 320,
    createdAt: '2024-01-10'
  },
  {
    id: 11,
    songId: 211,
    songTitle: 'Rewrite',
    artist: 'Asian Kung-Fu Generation',
    workTitle: 'Fullmetal Alchemist',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 289,
    createdAt: '2024-01-11'
  },
  {
    id: 12,
    songId: 212,
    songTitle: 'Contratado',
    artist: 'Hitomi Kuroishi',
    workTitle: 'Code Geass',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 244,
    createdAt: '2024-01-12'
  },
  {
    id: 13,
    songId: 213,
    songTitle: 'Ignite',
    artist: 'Aoi Eir',
    workTitle: 'Sword Art Online',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 268,
    createdAt: '2024-01-13'
  },
  {
    id: 14,
    songId: 214,
    songTitle: 'Unravel',
    artist: 'TK from Ling tosite sigure',
    workTitle: 'Tokyo Ghoul',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 300,
    createdAt: '2024-01-14'
  },
  {
    id: 15,
    songId: 215,
    songTitle: 'Power',
    artist: 'King Gnu',
    workTitle: 'Jujutsu Kaisen',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 256,
    createdAt: '2024-01-15'
  }
]

const mockFavoriteArtists: FavoriteArtist[] = [
  {
    id: 1,
    artistId: 301,
    artistName: 'LiSA',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 5420000,
    createdAt: '2024-01-01'
  },
  {
    id: 2,
    artistId: 302,
    artistName: 'Yuki Kajiura',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 1200000,
    createdAt: '2024-01-02'
  },
  {
    id: 3,
    artistId: 303,
    artistName: 'Hiroyuki Sawano',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 890000,
    createdAt: '2024-01-03'
  },
  {
    id: 4,
    artistId: 304,
    artistName: 'RADWIMPS',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 2340000,
    createdAt: '2024-01-04'
  },
  {
    id: 5,
    artistId: 305,
    artistName: 'Yoshimasa Terui',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 650000,
    createdAt: '2024-01-05'
  },
  {
    id: 6,
    artistId: 306,
    artistName: 'Takeshi Abo',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 780000,
    createdAt: '2024-01-06'
  },
  {
    id: 7,
    artistId: 307,
    artistName: 'Kenji Kawai',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 920000,
    createdAt: '2024-01-07'
  },
  {
    id: 8,
    artistId: 308,
    artistName: 'Hideki Taniuchi',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 1580000,
    createdAt: '2024-01-08'
  },
  {
    id: 9,
    artistId: 309,
    artistName: 'Michiru Oshima',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 1140000,
    createdAt: '2024-01-09'
  },
  {
    id: 10,
    artistId: 310,
    artistName: 'Yutaka Yamada',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 980000,
    createdAt: '2024-01-10'
  },
  {
    id: 11,
    artistId: 311,
    artistName: 'Aoi Eir',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 3210000,
    createdAt: '2024-01-11'
  },
  {
    id: 12,
    artistId: 312,
    artistName: 'TK from Ling tosite sigure',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 2750000,
    createdAt: '2024-01-12'
  },
  {
    id: 13,
    artistId: 313,
    artistName: 'Eve',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 4560000,
    createdAt: '2024-01-13'
  },
  {
    id: 14,
    artistId: 314,
    artistName: 'King Gnu',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 2890000,
    createdAt: '2024-01-14'
  },
  {
    id: 15,
    artistId: 315,
    artistName: 'ALI',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100',
    followersCount: 1670000,
    createdAt: '2024-01-15'
  }
]

export const useFavorites = () => {
  // 获取用户收藏的专辑列表
  const getFavoriteWorks = async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<GetFavoritesResponse<FavoriteWork>> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      data: mockFavoriteWorks.slice(start, end),
      total: mockFavoriteWorks.length,
      page,
      pageSize
    }
  }

  // 获取用户收藏的歌曲列表
  const getFavoriteSongs = async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<GetFavoritesResponse<FavoriteSong>> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      data: mockFavoriteSongs.slice(start, end),
      total: mockFavoriteSongs.length,
      page,
      pageSize
    }
  }

  // 获取用户关注的艺术家列表
  const getFavoriteArtists = async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<GetFavoritesResponse<FavoriteArtist>> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      data: mockFavoriteArtists.slice(start, end),
      total: mockFavoriteArtists.length,
      page,
      pageSize
    }
  }

  // 获取收藏统计信息
  const getFavoritesStats = async (): Promise<FavoritesStats> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    return {
      worksCount: mockFavoriteWorks.length,
      songsCount: mockFavoriteSongs.length,
      artistsCount: mockFavoriteArtists.length
    }
  }

  // 添加收藏
  const addFavorite = async (itemId: number, type: 'work' | 'song' | 'artist'): Promise<boolean> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    // 模拟添加成功
    return true
  }

  // 删除收藏
  const removeFavorite = async (itemId: number, type: 'work' | 'song' | 'artist'): Promise<boolean> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    // 模拟删除成功
    return true
  }

  // 检查是否已收藏
  const checkFavorite = async (
    itemId: number,
    type: 'work' | 'song' | 'artist'
  ): Promise<CheckFavoriteResponse> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 200))

    // 模拟检查结果
    return {
      isFavorited: Math.random() > 0.5,
      favoriteId: Math.random() > 0.5 ? Math.floor(Math.random() * 1000) : undefined
    }
  }

  // 删除一个收藏项
  const removeFavoriteItem = async (
    favoriteId: number,
    type: 'work' | 'song' | 'artist'
  ): Promise<boolean> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    // 模拟删除成功
    return true
  }

  return {
    getFavoriteWorks,
    getFavoriteSongs,
    getFavoriteArtists,
    getFavoritesStats,
    addFavorite,
    removeFavorite,
    checkFavorite,
    removeFavoriteItem
  }
}
