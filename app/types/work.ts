import type { ApiResponse } from './api'

// ── String Literal Types ────────────────────────────────────────────────────

/** 作品类型：合辑 / 专辑 / 单曲 / EP */
export type WorkType = 'compilation' | 'album' | 'single' | 'ep' | string

/** 【关联商品】版本类型：普通版 / 限定版（WorkProduct.edition_type） */
export type EditionType = 'regular' | 'limited' | string

/** 【关联商品】发行载体：实体 / 数字（WorkProduct.medium） */
export type MediumType = 'physical' | 'digital' | string

/** 【关联特典】内容类型：数字内容 / 实体特典（WorkBonus.type） */
export type BonusType = 'digital_content' | 'physical_bonus' | string

/** 【关联艺术家】类型：个人 / 团队 / 公司 / 虚拟 / 同人社团 */
export type ArtistType = 'person' | 'group' | 'company' | 'virtual' | 'circle' | string

/** 【关联艺链接】分类：官网 / 流媒体 / 购买渠道 */
export type LinkCategory = 'official' | 'streaming' | 'purchase' | string

// ── Sub-types ──────────────────────────────────────────────────────────────

/** 用户收听状态统计（各状态的人数） */
export interface TrackingStats {
  plan_to_listen: number  // 想听
  completed: number       // 听过
  wishlist: number        // 愿望单
  owned: number           // 已拥有
  dropped: number         // 放弃
}

/** 碟片信息（来自 structure 字段） */
export interface WorkDisc {
  disc_number: number
  title: string | null
  catalog_number: string | null
  length: number | null       // 碟片时长（秒），可能为 null
  is_bonus: boolean           // 是否为特典碟
  is_counted: boolean         // 是否计入曲目统计
}

/** 艺术家与作品的关联中间表数据 */
export interface ArtistPivot {
  work_id: number
  artist_id: number
  display_name: string | null // 在该作品中的显示名（覆盖默认名称）
  created_at: string
  updated_at: string
}

/** 作品关联的艺术家（含 pivot 中间表） */
export interface WorkArtist {
  id: number
  name: string
  slug: string | null
  bio: string | null
  type: ArtistType
  region: string | null
  is_active: boolean
  meta: Record<string, any> | null
  followers_count: number
  albums_count: number
  active_since: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  pivot: ArtistPivot
}

/** 原始制作人员条目（来自 Work.credits，可能含 song_id 用于关联曲目） */
export interface WorkCredit {
  song_id: number | null
  artist_id: number | null
  role: string | null
  display_name: string | null
  artist_name: string | null
  artist?: WorkArtist | null  // 页面层根据 artist_id 注入
}

/** 曲目信息 */
export interface WorkSong {
  id: number
  work_id: number
  title: string
  disc_number: number
  track_number: number
  duration: number | null     // 时长（秒）
  is_instrumental: boolean    // 是否为纯音乐
  has_lyrics: boolean         // 是否有歌词
  translations_count: number
  likes_count: number
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  is_favorited: boolean       // 当前用户是否收藏
  credits?: WorkCredit[]      // 页面层注入的曲目 credit 信息
}

/** 商品版本信息（对应不同发售形态，如初回盘、通常盘） */
export interface WorkProduct {
  id: number
  name: string
  edition_type: EditionType
  limited_rule: string | null   // 限定规则说明
  limited_name: string | null   // 限定版名称
  catalog_number: string | null
  barcode: string | null
  medium: MediumType
  format: string | null         // 格式描述，如 "2 CD"、"Blu-ray"
  is_hires: boolean             // 是否为高解析度音频
  price: string | null          // 定价（字符串保留精度）
  currency: string | null       // 货币代码，如 "JPY"
  release_date: string | null
  is_available: boolean         // 是否仍在销售
  image_url: string | null
  sort_order: number
  meta: Record<string, any> | null
}

/** 特典内容（附赠品） */
export interface WorkBonus {
  id: number
  product_id: number | null     // 关联商品，null 表示通用特典
  name: string
  type: BonusType
  description: string | null
  is_digital: boolean
  image_url: string | null
  meta: Record<string, any> | null
}

/** 外链来源平台信息 */
export interface LinkProvider {
  id: number
  name: string
  icon_url: string | null
  category: LinkCategory
}

/** 作品相关外部链接（官网、流媒体等） */
export interface WorkLink {
  id: number
  url: string
  is_verified: boolean
  meta: Record<string, any> | null
  provider: LinkProvider
  created_at: string
  updated_at: string
}

// ── Work Detail ────────────────────────────────────────────────────────────

/** 作品详情（GET /works/:id 返回的 data 字段） */
export interface Work {
  id: number
  title: string
  slug: string | null
  type: WorkType
  classification: string | null
  release_date: string | null
  catalog_number: string | null
  image_url: string | null
  banner_url: string | null
  disc_count: number
  track_count: number
  duration: number              // 总时长（秒），0 表示未知
  release_event_id: number | null
  likes_count: number
  reviews_count: number
  views_count: number
  rating: number                // 平均评分
  rating_count: number
  ranking: number | null        // 排行榜名次
  tracking_stats: TrackingStats
  descriptions: any[]           // 多语言简介，结构待定
  structure: WorkDisc[]         // 碟片结构列表
  notes: string | null
  meta: Record<string, any> | null
  artists: WorkArtist[]
  songs: WorkSong[]
  credits: any[]                // 制作人员，结构待定
  products: WorkProduct[]
  bonuses: WorkBonus[]
  entries: any[]                // 参赛/入榜记录，结构待定
  links: WorkLink[]
  reviews: any[]                // 评论列表，结构待定
  contributors: any[]           // 贡献者，结构待定
  is_favorited: boolean         // 当前用户是否收藏该作品
  user_tracking: any | null     // 当前用户的收听状态，结构待定
  created_at: string
  updated_at: string
}

// ── API Response ───────────────────────────────────────────────────────────

/** 作品详情接口完整响应类型 */
export type WorkResponse = ApiResponse<Work>

// ── Component-level derived types ──────────────────────────────────────────

/** WorkCredits 组件：单条制作人员展示项 */
export interface WorkCreditItem {
  name: string
  artist_id: number | null
}

/** WorkCredits 组件：按职能分组的制作人员 */
export interface WorkCreditGroup {
  role: string
  artists: WorkCreditItem[]
}

/** WorkArtistCard 组件：转换后的艺术家展示数据 */
export interface WorkArtistCardItem {
  id: number
  name: string
  displayName: string   // 优先用 pivot.display_name，否则 name
  avatar: string
}

/** WorkBonuses 组件：特典 + 关联商品（页面层组装） */
export interface WorkBonusWithProduct extends WorkBonus {
  product: WorkProduct | null
}

/** WorkHero 组件：转换后的作品头部展示数据 */
export interface WorkHeroData {
  title: string
  type: string | null
  artists: WorkArtist[]
  releaseDate: string
  discCount: number
  trackCount: number
  catalogNumber: string
  coverImage: string
  backgroundImage: string
}
