/**
 * 追踪管理 Composable
 * 提供专辑追踪状态的获取、添加、删除、更新等功能
 */

import type {
  TrackingWork,
  TrackingStatus,
  TrackingStats,
  GetTrackingWorksResponse
} from '~/types/tracking'

// ==================== Mock 数据 ====================
let mockTrackingWorks: TrackingWork[] = [
  // plan_to_listen (想听) - 3 条
  {
    id: 1,
    workId: 1001,
    workTitle: 'Wish You Were Here',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1975-09-15',
    catalog_number: 'SHVL-814',
    disc_count: 1,
    track_count: 9,
    type: 'album',
    artists: [
      { id: 101, name: 'Pink Floyd', image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp' }
    ],
    status: 'plan_to_listen',
    statusUpdatedAt: '2024-01-15',
    addedAt: '2024-01-10'
  },
  {
    id: 2,
    workId: 1002,
    workTitle: 'The Dark Side of the Moon',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1973-03-01',
    catalog_number: 'SHVL-804',
    disc_count: 1,
    track_count: 10,
    type: 'album',
    artists: [{ id: 101, name: 'Pink Floyd' }],
    status: 'plan_to_listen',
    statusUpdatedAt: '2024-01-14',
    addedAt: '2024-01-08'
  },
  {
    id: 3,
    workId: 1003,
    workTitle: 'The Wall',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1979-11-30',
    catalog_number: 'SHVL-411',
    disc_count: 2,
    track_count: 26,
    type: 'album',
    artists: [{ id: 101, name: 'Pink Floyd' }],
    status: 'plan_to_listen',
    statusUpdatedAt: '2024-01-12',
    addedAt: '2024-01-05'
  },

  // wishlist (想要) - 2 条
  {
    id: 4,
    workId: 1004,
    workTitle: 'Abbey Road',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1969-09-26',
    catalog_number: 'PCS-7088',
    disc_count: 1,
    track_count: 17,
    type: 'album',
    artists: [{ id: 102, name: 'The Beatles' }],
    status: 'wishlist',
    statusUpdatedAt: '2024-01-11',
    addedAt: '2024-01-03'
  },
  {
    id: 5,
    workId: 1005,
    workTitle: 'Rumours',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1977-02-04',
    catalog_number: 'K50364',
    disc_count: 1,
    track_count: 11,
    type: 'album',
    artists: [{ id: 103, name: 'Fleetwood Mac' }],
    status: 'wishlist',
    statusUpdatedAt: '2024-01-09',
    addedAt: '2024-01-02'
  },

  // completed (听过) - 5 条
  {
    id: 6,
    workId: 2001,
    workTitle: 'OK Computer',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1997-06-16',
    catalog_number: 'CXDM-2010',
    disc_count: 1,
    track_count: 12,
    type: 'album',
    artists: [{ id: 104, name: 'Radiohead' }],
    status: 'completed',
    statusUpdatedAt: '2024-01-25',
    addedAt: '2023-12-20'
  },
  {
    id: 7,
    workId: 2002,
    workTitle: 'In Rainbows',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '2007-10-10',
    catalog_number: 'XLS-158',
    disc_count: 1,
    track_count: 10,
    type: 'album',
    artists: [{ id: 104, name: 'Radiohead' }],
    status: 'completed',
    statusUpdatedAt: '2024-01-24',
    addedAt: '2023-12-15'
  },
  {
    id: 8,
    workId: 2003,
    workTitle: 'A Moon Shaped Pool',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '2016-05-08',
    catalog_number: 'XLS-208',
    disc_count: 1,
    track_count: 11,
    type: 'album',
    artists: [{ id: 104, name: 'Radiohead' }],
    status: 'completed',
    statusUpdatedAt: '2024-01-23',
    addedAt: '2023-12-10'
  },
  {
    id: 9,
    workId: 2004,
    workTitle: 'The Bends',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1995-03-23',
    catalog_number: 'CXDM-2002',
    disc_count: 1,
    track_count: 12,
    type: 'album',
    artists: [{ id: 104, name: 'Radiohead' }],
    status: 'completed',
    statusUpdatedAt: '2024-01-22',
    addedAt: '2023-12-05'
  },
  {
    id: 10,
    workId: 2005,
    workTitle: 'Amnestic',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '2000-10-04',
    catalog_number: 'XLS-129',
    disc_count: 2,
    track_count: 22,
    type: 'album',
    artists: [{ id: 104, name: 'Radiohead' }],
    status: 'completed',
    statusUpdatedAt: '2024-01-21',
    addedAt: '2023-11-30'
  },

  // owned (已入手) - 5 条
  {
    id: 11,
    workId: 3001,
    workTitle: 'Nevermind',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1991-09-24',
    catalog_number: 'DGC-24425',
    disc_count: 1,
    track_count: 12,
    type: 'album',
    artists: [{ id: 105, name: 'Nirvana' }],
    status: 'owned',
    statusUpdatedAt: '2024-01-20',
    addedAt: '2023-11-15'
  },
  {
    id: 12,
    workId: 3002,
    workTitle: 'In Utero',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1993-09-21',
    catalog_number: 'DGC-24536',
    disc_count: 1,
    track_count: 14,
    type: 'album',
    artists: [{ id: 105, name: 'Nirvana' }],
    status: 'owned',
    statusUpdatedAt: '2024-01-19',
    addedAt: '2023-11-10'
  },
  {
    id: 13,
    workId: 3003,
    workTitle: 'Bleach',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1989-06-15',
    catalog_number: 'SST-206',
    disc_count: 1,
    track_count: 12,
    type: 'album',
    artists: [{ id: 105, name: 'Nirvana' }],
    status: 'owned',
    statusUpdatedAt: '2024-01-18',
    addedAt: '2023-11-05'
  },
  {
    id: 14,
    workId: 3004,
    workTitle: 'MTV Unplugged in New York',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1994-11-01',
    catalog_number: 'DGC-24727',
    disc_count: 1,
    track_count: 14,
    type: 'album',
    artists: [{ id: 105, name: 'Nirvana' }],
    status: 'owned',
    statusUpdatedAt: '2024-01-17',
    addedAt: '2023-10-30'
  },
  {
    id: 15,
    workId: 3005,
    workTitle: 'With the Lights Out',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '2004-11-23',
    catalog_number: 'DGC-B001380K',
    disc_count: 3,
    track_count: 45,
    type: 'album',
    artists: [{ id: 105, name: 'Nirvana' }],
    status: 'owned',
    statusUpdatedAt: '2024-01-16',
    addedAt: '2023-10-25'
  },

  // dropped (不感兴趣) - 7 条
  {
    id: 16,
    workId: 4001,
    workTitle: 'Led Zeppelin IV',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1971-11-08',
    catalog_number: 'Atlantic SD 7208',
    disc_count: 1,
    track_count: 8,
    type: 'album',
    artists: [{ id: 106, name: 'Led Zeppelin' }],
    status: 'dropped',
    statusUpdatedAt: '2024-01-15',
    addedAt: '2023-08-20'
  },
  {
    id: 17,
    workId: 4002,
    workTitle: 'Led Zeppelin II',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1969-10-22',
    catalog_number: 'Atlantic SD 8236',
    disc_count: 1,
    track_count: 9,
    type: 'album',
    artists: [{ id: 106, name: 'Led Zeppelin' }],
    status: 'dropped',
    statusUpdatedAt: '2024-01-14',
    addedAt: '2023-08-15'
  },
  {
    id: 18,
    workId: 4003,
    workTitle: 'Physical Graffiti',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1975-02-20',
    catalog_number: 'Atlantic SD 88-201',
    disc_count: 2,
    track_count: 15,
    type: 'album',
    artists: [{ id: 106, name: 'Led Zeppelin' }],
    status: 'dropped',
    statusUpdatedAt: '2024-01-13',
    addedAt: '2023-08-10'
  },
  {
    id: 19,
    workId: 4004,
    workTitle: 'Houses of the Holy',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1973-03-28',
    catalog_number: 'Atlantic SD 7255',
    disc_count: 1,
    track_count: 8,
    type: 'album',
    artists: [{ id: 106, name: 'Led Zeppelin' }],
    status: 'dropped',
    statusUpdatedAt: '2024-01-12',
    addedAt: '2023-08-05'
  },
  {
    id: 20,
    workId: 4005,
    workTitle: 'In Through the Out Door',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1979-08-15',
    catalog_number: 'Swan Song SS 8416',
    disc_count: 1,
    track_count: 8,
    type: 'album',
    artists: [{ id: 106, name: 'Led Zeppelin' }],
    status: 'dropped',
    statusUpdatedAt: '2024-01-11',
    addedAt: '2023-08-01'
  },
  {
    id: 21,
    workId: 4006,
    workTitle: 'Presence',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1976-03-31',
    catalog_number: 'Swan Song SS 8416',
    disc_count: 1,
    track_count: 7,
    type: 'album',
    artists: [{ id: 106, name: 'Led Zeppelin' }],
    status: 'dropped',
    statusUpdatedAt: '2024-01-10',
    addedAt: '2023-07-28'
  },
  {
    id: 22,
    workId: 4007,
    workTitle: 'Led Zeppelin III',
    image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
    release_date: '1970-10-05',
    catalog_number: 'Atlantic SD 7201',
    disc_count: 1,
    track_count: 10,
    type: 'album',
    artists: [{ id: 106, name: 'Led Zeppelin' }],
    status: 'dropped',
    statusUpdatedAt: '2024-01-09',
    addedAt: '2023-07-25'
  }
]

// ==================== 统计函数 ====================
const calculateStats = (works: TrackingWork[]): TrackingStats => {
  return {
    plan_to_listen: works.filter(w => w.status === 'plan_to_listen').length,
    wishlist: works.filter(w => w.status === 'wishlist').length,
    completed: works.filter(w => w.status === 'completed').length,
    owned: works.filter(w => w.status === 'owned').length,
    dropped: works.filter(w => w.status === 'dropped').length,
    total: works.length
  }
}

export const useTracking = () => {
  /**
   * 获取某个状态的追踪专辑列表
   * @param status 追踪状态
   * @param page 分页页码
   * @param pageSize 每页数量
   */
  const getTrackingWorks = async (
    status: TrackingStatus,
    page: number = 1,
    pageSize: number = 12
  ): Promise<GetTrackingWorksResponse> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const filtered = mockTrackingWorks.filter(w => w.status === status)
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize
    }
  }

  /**
   * 获取追踪统计信息
   */
  const getTrackingStats = async (): Promise<TrackingStats> => {
    // Mock API 延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    return calculateStats(mockTrackingWorks)
  }

  /**
   * 创建新的追踪记录
   */
  const createTracking = async (
    workId: number,
    status: TrackingStatus = 'wishlist'
  ): Promise<TrackingWork> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    // 模拟响应
    return {
      id: Math.floor(Math.random() * 10000),
      workId,
      workTitle: '新专辑',
      image_url: 'https://i.psray.net/i/2026/01/29/697b559e47e02.webp',
      release_date: new Date().toISOString().split('T')[0],
      catalog_number: 'CAT000',
      disc_count: 1,
      track_count: 12,
      type: 'album',
      artists: [{ id: 0, name: '未知艺术家' }],
      status,
      statusUpdatedAt: new Date().toISOString(),
      addedAt: new Date().toISOString()
    }
  }

  /**
   * 更新追踪状态
   */
  const updateTrackingStatus = async (
    trackingId: number,
    newStatus: TrackingStatus
  ): Promise<TrackingWork> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    // 模拟更新
    const work = mockTrackingWorks.find(w => w.id === trackingId)
    if (work) {
      work.status = newStatus
      work.statusUpdatedAt = new Date().toISOString()
    }
    return work!
  }

  /**
   * 删除追踪记录
   */
  const removeTracking = async (trackingId: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    // 模拟删除
    const index = mockTrackingWorks.findIndex(w => w.id === trackingId)
    if (index > -1) {
      mockTrackingWorks.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 检查专辑是否已追踪
   */
  const checkTracking = async (workId: number): Promise<TrackingWork | null> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockTrackingWorks.find(w => w.workId === workId) || null
  }

  return {
    getTrackingWorks,
    getTrackingStats,
    createTracking,
    updateTrackingStatus,
    removeTracking,
    checkTracking
  }
}
