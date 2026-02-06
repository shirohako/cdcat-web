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
        :album-data="albumData"
        :work-id="workId"
      />

    <!-- Album Details Section -->
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <AlbumProducts
            v-if="products.length > 0"
            :products="products"
          />

          <AlbumBonuses
            v-if="bonuses.length > 0"
            :bonuses="bonuses"
          />

          <AlbumDescriptions
            v-if="albumDescriptions.length > 0"
            :descriptions="albumDescriptions"
          />
          <AlbumCredits
            v-if="credits.length > 0"
            :credits="credits"
          />
          <AlbumTracklist
            :songs="songs"
            :structure="albumStructure"
          />

          <!-- Reviews -->
          <AlbumReviews :reviews="mockReviews" class="hidden" />
        </div>

        <!-- Right Column - Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 显示所有艺术家 -->
          <AlbumArtistCard :artists="artistsData" />

          <!-- 追踪状态 -->
          <AlbumTracking :work-id="workId" />

          <AlbumStats :stats="stats" />

          <AlbumRankings
            :all-time-rank="rankings.allTimeRank"
            :all-time-total="rankings.allTimeTotal"
            :year2025-rank="rankings.year2025Rank"
            :year2025-total="rankings.year2025Total"
            :genre-rank="rankings.genreRank"
            :genre-total="rankings.genreTotal"
            :genre-name="rankings.genreName"
          />

          <!-- Links -->
          <AlbumLinks :links="links" />

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

  return {
    title: work.title || "",
    artists: work.artists || [], // 传递完整的 artists 数组，包含 pivot 数据
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
  if (!list.length) return [];

  const groups = new Map();
  for (const item of list) {
    const role = item.role || 'Staff';
    // 优先级：外层 display_name -> artist.name -> pivot.display_name
    const name = item.display_name || item.artist?.name || item.artist?.pivot?.display_name || item.name;
    if (name) {
      const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
      if (!groups.has(displayRole)) groups.set(displayRole, []);
      if (!groups.get(displayRole).includes(name)) groups.get(displayRole).push(name);
    }
  }

  return Array.from(groups.entries()).map(([role, names]) => ({
    role,
    names: names.join(', ')
  }));
});

const links = computed(() => workData.value?.links || []);

// TODO: 替换为真实 API 数据 workData.value?.products / workData.value?.bonuses
const mockProducts = [
  {
    id: 1,
    work_id: workId,
    edition_type: 'LIMITED',
    edition_name: '初回限定盤',
    is_limited: true,
    limited_rule: 'COUNT',
    limited_name: null,
    catalog_number: 'SRCL-12345',
    barcode: '4547366512345',
    format: 'CD + Blu-ray',
    medium: 'physical',
    is_hires: false,
    release_date: '2024-12-18',
    prices: { JPY: 4950 },
    is_available: true,
    image_url: null,
  },
  {
    id: 2,
    work_id: workId,
    edition_type: 'REGULAR',
    edition_name: '通常盤',
    is_limited: false,
    limited_rule: null,
    limited_name: null,
    catalog_number: 'SRCL-12346',
    barcode: '4547366512346',
    format: 'CD',
    medium: 'physical',
    is_hires: false,
    release_date: '2024-12-18',
    prices: { JPY: 3300 },
    is_available: true,
    image_url: null,
  },
  {
    id: 3,
    work_id: workId,
    edition_type: 'LIMITED',
    edition_name: '期間生産限定盤',
    is_limited: true,
    limited_rule: 'PERIOD',
    limited_name: null,
    catalog_number: 'SRCL-12347',
    barcode: '4547366512347',
    format: 'CD + DVD',
    medium: 'physical',
    is_hires: false,
    release_date: '2024-12-18',
    prices: { JPY: 4400 },
    is_available: false,
    image_url: null,
  },
  {
    id: 4,
    work_id: workId,
    edition_type: 'REGULAR',
    edition_name: null,
    is_limited: false,
    limited_rule: null,
    limited_name: null,
    catalog_number: null,
    barcode: null,
    format: 'FLAC / AAC',
    medium: 'digital',
    is_hires: true,
    release_date: '2024-12-18',
    prices: { JPY: 2750 },
    is_available: true,
    image_url: null,
  },
];

const mockBonuses = [
  {
    id: 1,
    work_id: workId,
    product_id: 1,
    type: 'blu_ray',
    name: 'Music Video Collection',
    description: '收录全部 3 首 Music Video 及 Making 映像',
    image_url: null,
  },
  {
    id: 2,
    work_id: workId,
    product_id: 1,
    type: 'photocard',
    name: 'Special Photocard Set (5枚)',
    description: '初回限定盤专属写真卡片套装',
    image_url: null,
  },
  {
    id: 3,
    work_id: workId,
    product_id: 3,
    type: 'dvd',
    name: 'Live Performance Digest',
    description: '2024年全国巡演精选现场映像',
    image_url: null,
  },
  {
    id: 4,
    work_id: workId,
    product_id: null,
    type: 'bonus_track',
    name: 'Acoustic Version - Track 03',
    description: '第3曲目的 Acoustic 重新编曲版',
    image_url: null,
  },
  {
    id: 5,
    work_id: workId,
    product_id: null,
    type: 'event_ticket',
    name: 'リリースイベント抽選応募券',
    description: '发售纪念活动抽选应募券（全版本共通）',
    image_url: null,
  },
  {
    id: 6,
    work_id: workId,
    product_id: 2,
    type: 'poster',
    name: 'B2 Size Poster',
    description: '通常盤购入特典海报',
    image_url: null,
  },
];

const products = computed(() => {
  // 优先使用 API 数据，如果没有则使用 mock
  return workData.value?.products?.length ? workData.value.products : mockProducts;
});

const bonuses = computed(() => {
  const productList = products.value;
  const productMap = new Map();
  productList.forEach(p => productMap.set(p.id, p));

  // 优先使用 API 数据，如果没有则使用 mock
  const list = workData.value?.bonuses?.length ? workData.value.bonuses : mockBonuses;

  return list.map(bonus => ({
    ...bonus,
    product: bonus.product_id ? productMap.get(bonus.product_id) || null : null,
  }));
});

const stats = {
  viewed: 15,
  liked: 3,
  owned: 0,
  wishlist: 0,
};

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

// Mock review data (测试数据 - 0-10分制，支持无评分评论)
const mockReviews = [
  {
    id: 1,
    score: 9,
    title: "A Masterpiece of Modern Music",
    author: "MusicLover2024",
    date: "Dec 15, 2024",
    content: "This album is absolutely stunning. The production quality is top-notch, and every track flows seamlessly into the next. The artist's evolution is clear, and this might be their best work yet."
  },
  {
    id: 2,
    score: 8,
    title: "Impressive and Refreshing",
    author: "AudiophileJane",
    date: "Dec 10, 2024",
    content: "I was blown away by the creativity displayed here. While a couple of tracks didn't resonate with me, the majority of the album is exceptional. Highly recommended for fans of the genre."
  },
  {
    id: 3,
    score: null,
    title: null,
    author: "RandomFan",
    date: "Dec 8, 2024",
    content: "Just wanted to say this album got me through some tough times. Thank you for creating this beautiful music."
  },
  {
    id: 4,
    score: 7,
    title: "Solid Album with Great Moments",
    author: "CasualListener",
    date: "Dec 5, 2024",
    content: "A good album overall. Some tracks are absolutely brilliant, while others feel a bit formulaic. Still worth a listen, especially if you enjoyed their previous work."
  },
  {
    id: 5,
    score: 10,
    title: "An Emotional Journey",
    author: "SoundscapeExplorer",
    date: "Nov 28, 2024",
    content: "This album took me on an emotional rollercoaster. The lyrics are poignant, the melodies are haunting, and the overall atmosphere is captivating. Can't stop listening to it."
  },
  {
    id: 6,
    score: null,
    title: "Thoughts on Track 3",
    author: "IndieEnthusiast",
    date: "Nov 25, 2024",
    content: "The third track really resonated with me. The way the melody builds up and then drops is just perfect. Would love to hear more songs like this."
  },
  {
    id: 7,
    score: 6,
    title: "Mixed Feelings",
    author: "CriticReviewer",
    date: "Nov 20, 2024",
    content: "While there are some standout tracks, the album feels inconsistent. Some songs are experimental in a good way, others miss the mark. It's not bad, but it's not great either."
  },
  {
    id: 8,
    score: 9,
    title: "Worth Every Second",
    author: "VinylCollector",
    date: "Nov 15, 2024",
    content: "From start to finish, this album delivers. The attention to detail in the production is remarkable, and you can tell the artist poured their heart into this project. A must-have in any collection."
  }
];
</script>
