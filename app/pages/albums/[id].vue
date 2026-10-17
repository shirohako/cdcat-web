<template>
  <div class="min-h-screen bg-base-100">
    <!-- 加载状态 -->
    <div v-if="pending" class="flex items-center justify-center min-h-screen">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="alert alert-error max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>加载失败: {{ error.message }}</span>
      </div>
    </div>

    <!-- 内容 -->
    <div v-else>
      <!-- Album Hero Section -->
      <AlbumHero
        :album-data="heroData"
        :album-id="albumId"
        :initial-favorited="albumData?.is_favorited ?? false"
        :streaming="albumData?.streaming ?? []"
      />

    <!-- Album Details Section -->
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <AlbumDescriptions
            v-if="albumData?.description"
            :description="albumData.description"
          />

          <AlbumProducts :products="products" />

          <AlbumBonuses
            :bonuses="bonuses"
            :products="albumData?.products ?? []"
          />
          <AlbumCredits
            v-if="credits.length > 0"
            :credits="credits"
          />
          <AlbumTracklist
            :tracks="tracks"
            :structure="albumStructure"
          />

          <!-- Reviews -->
          <AlbumReviews
            :initial-reviews="initialReviews"
            :reviews-count="reviewsCount"
            :album-id="albumId"
          />

          <!-- Review Modal -->
          <AlbumReviewModal
            v-model="showReviewModal"
            :album-id="albumId"
            @saved="onReviewSaved"
          />
        </div>

        <!-- Right Column - Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 显示所有艺术家 -->
          <AlbumArtistCard :artists="artistsData" />

          <!-- 追踪状态 -->
          <AlbumTracking :album-id="albumId" :initial-tracking="albumData?.user_tracking ?? null" />

          <AlbumStats
            :views-count="albumData?.views_count ?? 0"
            :favorites-count="albumData?.favorites_count ?? 0"
            :tracking-stats="trackingStats"
          />

          <AlbumRankings
            :user-score="albumData?.rating ?? 0"
            :rating-count="albumData?.reviews_count ?? 0"
            @write-review="handleWriteReview"
          />

          <!-- Links -->
          <AlbumLinks :links="links" />

          <!-- Related Articles -->
          <AlbumArticles :articles="articles" />

          <!-- Related Discussions -->
          <DiscussionRelatedDiscussions v-if="albumData" :id="albumData.id" type="album" />

          <!-- Data Contributors -->
          <AlbumContributors :contributors="contributors" />
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  Album,
  AlbumTrack,
  AlbumDisc,
  AlbumProduct,
  AlbumLink,
  AlbumArticle,
  TrackingStats,
  AlbumCreditGroup,
  AlbumArtistCardItem,
  AlbumHeroData,
  AlbumBonusWithProduct,
} from '~/types/album'
import AlbumHero from '~/components/album/AlbumHero.vue'
import AlbumProducts from '~/components/album/AlbumProducts.vue'
import AlbumBonuses from '~/components/album/AlbumBonuses.vue'
import AlbumDescriptions from '~/components/album/AlbumDescriptions.vue'
import AlbumCredits from '~/components/album/AlbumCredits.vue'
import AlbumTracklist from '~/components/album/AlbumTracklist.vue'
import AlbumReviews from '~/components/album/AlbumReviews.vue'
import AlbumReviewModal from '~/components/album/AlbumReviewModal.vue'
import AlbumArtistCard from '~/components/album/AlbumArtistCard.vue'
import AlbumTracking from '~/components/album/AlbumTracking.vue'
import AlbumStats from '~/components/album/AlbumStats.vue'
import AlbumRankings from '~/components/album/AlbumRankings.vue'
import AlbumLinks from '~/components/album/AlbumLinks.vue'
import AlbumContributors from '~/components/album/AlbumContributors.vue'
import AlbumArticles from '~/components/album/AlbumArticles.vue'

const { isAuthenticated } = useAuth()
const router = useRouter()

// 评价弹窗状态
const showReviewModal = ref(false)

const handleWriteReview = () => {
  if (!isAuthenticated.value) {
    navigateTo({ path: '/auth/login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  showReviewModal.value = true
}

const onReviewSaved = () => {
  refreshAlbumData()
}

// 获取路由参数
const route = useRoute()
const albumId = route.params.id as string

// 从 API 获取专辑数据
const { data: albumData, pending, error, refresh: refreshAlbumData } = await useAPI<Album>(`/v1/albums/${albumId}`)

const seoTitle = computed(() => albumData.value?.title || 'Album')
const seoDescription = computed(() => {
  const album = albumData.value
  if (album?.description) return album.description.slice(0, 160)
  if (album?.title) return `Listen to ${album.title} on CDCAT.`
  return 'Music album details on CDCAT.'
})
useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: computed(() => seoTitle.value ? `${seoTitle.value} | CDCAT` : 'CDCAT'),
  ogDescription: seoDescription,
  ogType: 'music.album',
  ogImage: computed(() => albumData.value?.image_url || undefined),
  twitterCard: 'summary_large_image',
})

// 处理 API 数据，转换为页面所需格式
const heroData = computed<AlbumHeroData>(() => {
  if (!albumData.value) {
    return {
      title: '',
      type: null,
      artists: [],
      releaseDate: '',
      discCount: 0,
      trackCount: 0,
      catalogNumber: '',
      coverImage: '',
      backgroundImage: '',
    }
  }
  const album = albumData.value
  return {
    title: album.title || '',
    type: album.type || null,
    artists: album.artists || [],
    releaseDate: album.release_date || '',
    discCount: album.disc_count || 0,
    trackCount: album.track_count || 0,
    catalogNumber: album.catalog_number || '',
    coverImage: album.image_url || '',
    backgroundImage: album.banner_url || album.image_url || '',
  }
})

// 处理艺术家数据 - 支持多个艺术家
const artistsData = computed<AlbumArtistCardItem[]>(() => {
  if (!albumData.value?.artists?.length) return []
  return albumData.value.artists.map(artist => ({
    id: artist.id,
    name: artist.name || '',
    displayName: artist.pivot?.display_name || artist.name || '',
    avatar: artist.image_url || '',
  }))
})

const tracks = computed<AlbumTrack[]>(() => {
  const list = albumData.value?.tracks ?? []
  const allCredits = albumData.value?.credits ?? []
  const artists = albumData.value?.artists ?? []

  // 创建 artist_id 到 artist 对象的映射
  const artistsMap = new Map(artists.map(a => [a.id, a]))

  const creditsMap = new Map<number, typeof allCredits>()
  for (const credit of allCredits) {
    if (credit.track_id) {
      if (!creditsMap.has(credit.track_id)) creditsMap.set(credit.track_id, [])
      creditsMap.get(credit.track_id)!.push({
        ...credit,
        artist: artistsMap.get(credit.artist_id!) ?? null,
      })
    }
  }

  return list.map(track => ({
    ...track,
    credits: creditsMap.get(track.id) ?? [],
  }))
})

const albumStructure = computed<AlbumDisc[]>(() => albumData.value?.structure ?? [])

const credits = computed<AlbumCreditGroup[]>(() => {
  const list = albumData.value?.credits ?? []
  const groups = new Map<string, { name: string; artist_id: number | null }[]>()
  for (const item of list) {
    const name = item.display_name || item.artist_name
    if (!name) continue
    const role = item.role || 'Staff'
    if (!groups.has(role)) groups.set(role, [])
    const existing = groups.get(role)!
    if (!existing.find(a => a.artist_id === item.artist_id && a.name === name)) {
      existing.push({ name, artist_id: item.artist_id })
    }
  }
  return Array.from(groups.entries()).map(([role, artists]) => ({ role, artists }))
})

const links = computed<AlbumLink[]>(() => albumData.value?.links ?? [])
const articles = computed<AlbumArticle[]>(() => albumData.value?.articles ?? [])
const contributors = computed(() => albumData.value?.contributors ?? [])
const initialReviews = computed(() => albumData.value?.reviews ?? [])
const reviewsCount = computed<number>(() => albumData.value?.reviews_count ?? 0)
const products = computed<AlbumProduct[]>(() => albumData.value?.products ?? [])

const bonuses = computed<AlbumBonusWithProduct[]>(() => {
  const productMap = new Map<number, AlbumProduct>(
    (albumData.value?.products ?? []).map(p => [p.id, p])
  )
  return (albumData.value?.bonuses ?? []).map(bonus => ({
    ...bonus,
    product: bonus.product_id ? (productMap.get(bonus.product_id) ?? null) : null,
  }))
})

const trackingStats = computed<TrackingStats>(() => albumData.value?.tracking_stats ?? {
  plan_to_listen: 0,
  completed: 0,
  wishlist: 0,
  owned: 0,
  dropped: 0,
})
</script>
