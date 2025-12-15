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
        :title="albumData.title"
        :label="albumData.label"
        :release-date="albumData.releaseDate"
        :format="albumData.format"
        :catalog-number="albumData.catalogNumber"
        :price="albumData.price"
        :cover-image="albumData.coverImage"
        :background-image="albumData.backgroundImage"
      />

    <!-- Album Details Section -->
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <AlbumDescriptions
            v-if="albumDescriptions.length > 0"
            :descriptions="albumDescriptions"
          />
          <AlbumCredits :credits="credits" />
          <AlbumTracklist 
            :songs="songs" 
            :structure="albumStructure"
          />

          <!-- Reviews -->
          <AlbumReviews />
        </div>

        <!-- Right Column - Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 显示所有艺术家 -->
          <AlbumArtistCard
            v-for="artist in artistsData"
            :key="artist.id"
            :name="artist.name"
            :avatar="artist.avatar"
            :since="artist.since"
            :discography="artist.discography"
            :credits-count="artist.creditsCount"
          />

          <AlbumStats :stats="stats" />

          <AlbumRating
            :rating="rating.score"
            :rating-text="rating.text"
            :review-count="rating.reviewCount"
          />

          <!-- Links -->
          <AlbumLinks />

          <!-- Data Contributors -->
          <AlbumContributors />
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>

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
  const discText = work.disc_count > 1 ? `${work.disc_count}CD` : "CD";
  const format = `${discText} | ${work.track_count} Tracks`;

  // 组合多个艺术家名称作为 label
  const artistNames = work.artists?.map(a => a.name).join(", ") || "";

  return {
    title: work.title || "",
    label: artistNames, // 使用所有艺术家的名字，用逗号分隔
    releaseDate: work.release_date || "",
    format: format,
    catalogNumber: work.catalog_number || "",
    price: "", // API 中没有这个字段，保持为空字符串，会被隐藏
    coverImage: work.image_url || "",
    backgroundImage: work.banner_url || work.image_url || "", // 优先使用 banner_url，否则使用 image_url
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
    avatar: artist.image_url || "",
    since: "Unknown", // API 中没有这个字段
    discography: 0, // API 中没有这个字段
    creditsCount: 0, // API 中没有这个字段
  }));
});

const albumDescriptions = computed(() => workData.value?.descriptions ?? []);
const songs = computed(() => workData.value?.songs ?? []);
const albumStructure = computed(() => workData.value?.structure ?? []);

const credits = [
  {
    role: "Compose",
    names:
      "ARForest, Nego_tiator, HAGANE, Elliot Hsu, Yuu(xh), AAAA, Haoto, Monmori Atsushi, Street, EmoCosine, ginihihaL, sakuzyo, mamomo, Roijii Theatre, Jun Kuroda, CapchJL, Ark, Juggernaut_, ESPITZ, Sdorica, Fmmn, lce, BlackY, Blacklolita, sakita, An",
  },
  { role: "Featuring", names: "marolt" },
  { role: "Producer", names: "ARForrest" },
  { role: "Mastering", names: "Chester Park" },
  { role: "Co-producer", names: "Chester Park" },
  { role: "Jacket Design", names: "habi" },
  { role: "Illustration", names: "Sin-cK" },
  { role: "Novel", names: "habi" },
  { role: "Japanese Translate", names: "ukaee" },
  { role: "Special Thanks", names: "EmoCosine" },
];

const stats = {
  viewed: 15,
  liked: 3,
  owned: 0,
  wishlist: 0,
};

const rating = {
  score: 9.0,
  text: "非常好评",
  reviewCount: 35,
};
</script>
