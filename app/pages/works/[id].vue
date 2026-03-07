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
      <!-- Work Hero Section -->
      <WorkHero
        :album-data="albumData"
        :work-id="workId"
        :initial-favorited="workData?.is_favorited ?? false"
      />

    <!-- Work Details Section -->
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <WorkProducts :products="products" />

          <WorkBonuses
            :bonuses="bonuses"
            :products="workData?.products ?? []"
          />

          <WorkDescriptions
            v-if="albumDescriptions.length > 0"
            :descriptions="albumDescriptions"
          />
          <WorkCredits
            v-if="credits.length > 0"
            :credits="credits"
          />
          <WorkTracklist
            :songs="songs"
            :structure="albumStructure"
          />

          <!-- Reviews -->
          <WorkReviews
            :initial-reviews="initialReviews"
            :reviews-count="reviewsCount"
            :work-id="workId"
          />

          <!-- Review Modal -->
          <WorkReviewModal
            v-model="showReviewModal"
            :work-id="workId"
            @saved="onReviewSaved"
          />
        </div>

        <!-- Right Column - Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 显示所有艺术家 -->
          <WorkArtistCard :artists="artistsData" />

          <!-- 追踪状态 -->
          <WorkTracking :work-id="workId" :initial-tracking="workData?.user_tracking ?? null" />

          <WorkStats
            :views-count="workData?.views_count ?? 0"
            :likes-count="workData?.likes_count ?? 0"
            :tracking-stats="trackingStats"
          />

          <WorkRankings
            :all-time-rank="rankings.allTimeRank"
            :all-time-total="rankings.allTimeTotal"
            :year2025-rank="rankings.year2025Rank"
            :year2025-total="rankings.year2025Total"
            :genre-rank="rankings.genreRank"
            :genre-total="rankings.genreTotal"
            :genre-name="rankings.genreName"
            @write-review="handleWriteReview"
          />

          <!-- Links -->
          <WorkLinks :links="links" />

          <!-- Data Contributors -->
          <WorkContributors :contributors="contributors" />
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import WorkHero from '~/components/work/WorkHero.vue'
import WorkProducts from '~/components/work/WorkProducts.vue'
import WorkBonuses from '~/components/work/WorkBonuses.vue'
import WorkDescriptions from '~/components/work/WorkDescriptions.vue'
import WorkCredits from '~/components/work/WorkCredits.vue'
import WorkTracklist from '~/components/work/WorkTracklist.vue'
import WorkReviews from '~/components/work/WorkReviews.vue'
import WorkReviewModal from '~/components/work/WorkReviewModal.vue'
import WorkArtistCard from '~/components/work/WorkArtistCard.vue'
import WorkTracking from '~/components/work/WorkTracking.vue'
import WorkStats from '~/components/work/WorkStats.vue'
import WorkRankings from '~/components/work/WorkRankings.vue'
import WorkLinks from '~/components/work/WorkLinks.vue'
import WorkContributors from '~/components/work/WorkContributors.vue'

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
  // TODO: 刷新评价列表
}

// 获取路由参数
const route = useRoute();
const workId = route.params.id;

// 从 API 获取作品数据
const { data: workData, pending, error } = await useAPI(`/v1/works/${workId}`);

// 处理 API 数据，转换为页面所需格式
const albumData = computed(() => {
  if (!workData.value) {
    return {
      title: "",
      label: "",
      releaseDate: "",
      format: "",
      catalogNumber: "",
      price: "",
      coverImage: "",
      backgroundImage: "",
    };
  }

  const work = workData.value;
  return {
    title: work.title || "",
    type: work.type || null,
    artists: work.artists || [],
    releaseDate: work.release_date || "",
    discCount: work.disc_count || 0,
    trackCount: work.track_count || 0,
    catalogNumber: work.catalog_number || "",
    coverImage: work.image_url || "",
    backgroundImage: work.banner_url || work.image_url || "",
  };
});

// 处理艺术家数据 - 支持多个艺术家
const artistsData = computed(() => {
  if (!workData.value?.artists || workData.value.artists.length === 0) {
    return [];
  }

  return workData.value.artists.map(artist => ({
    id: artist.id,
    name: artist.name || "",
    displayName: artist.pivot?.display_name || artist.name || "",
    avatar: artist.image_url || "",
  }));
});

const albumDescriptions = computed(() => workData.value?.descriptions ?? []);
const songs = computed(() => {
  const list = workData.value?.songs ?? [];
  const allCredits = workData.value?.credits ?? [];
  const artists = workData.value?.artists ?? [];

  // 创建 artist_id 到 artist 对象的映射
  const artistsMap = new Map();
  artists.forEach(artist => {
    artistsMap.set(artist.id, artist);
  });

  const creditsMap = new Map();
  for (const credit of allCredits) {
    if (credit.song_id) {
      if (!creditsMap.has(credit.song_id)) creditsMap.set(credit.song_id, []);

      // 关联 artist 信息
      const creditWithArtist = {
        ...credit,
        artist: artistsMap.get(credit.artist_id) || null
      };
      creditsMap.get(credit.song_id).push(creditWithArtist);
    }
  }

  return list.map((song) => ({
    ...song,
    credits: creditsMap.get(song.id) || [],
  }));
});
const albumStructure = computed(() => workData.value?.structure ?? []);

const credits = computed(() => {
  const list = workData.value?.credits || [];
  const groups = new Map();
  for (const item of list) {
    const name = item.display_name || item.artist_name;
    if (!name) continue;
    const role = item.role || 'Staff';
    if (!groups.has(role)) groups.set(role, []);
    const existing = groups.get(role);
    if (!existing.find(a => a.artist_id === item.artist_id && a.name === name)) {
      existing.push({ name, artist_id: item.artist_id });
    }
  }
  return Array.from(groups.entries()).map(([role, artists]) => ({ role, artists }));
});

const links = computed(() => workData.value?.links || []);
const contributors = computed(() => workData.value?.contributors ?? []);
const initialReviews = computed(() => workData.value?.reviews ?? []);
const reviewsCount = computed(() => workData.value?.reviews_count ?? 0);

const products = computed(() => workData.value?.products ?? []);

const bonuses = computed(() => {
  const productMap = new Map();
  (workData.value?.products ?? []).forEach(p => productMap.set(p.id, p));
  return (workData.value?.bonuses ?? []).map(bonus => ({
    ...bonus,
    product: bonus.product_id ? productMap.get(bonus.product_id) || null : null,
  }));
});

const trackingStats = computed(() => workData.value?.tracking_stats ?? {
  plan_to_listen: 0,
  completed: 0,
  wishlist: 0,
  owned: 0,
  dropped: 0,
});

// 排行榜数据（测试数据）
const rankings = {
  allTimeRank: 142,
  allTimeTotal: 15234,
  year2025Rank: 8,
  year2025Total: 856,
  genreRank: 23,
  genreTotal: 2341,
  genreName: "Rock",
};

</script>
