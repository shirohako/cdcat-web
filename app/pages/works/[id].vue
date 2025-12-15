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
          <AlbumDescriptions :slogan="slogan" :descriptions="descriptions" />
          <AlbumCredits :credits="credits" />
          <AlbumTracklist :tracks="tracks" />

          <!-- Memos -->
          <section class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare :size="24" />
              Memos
            </h2>
            <p class="text-gray-500 text-sm">No memos yet.</p>
          </section>

          <!-- Reviews -->
          <section class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
              <Star :size="24" />
              Reviews
            </h2>
            <p class="text-gray-500 text-sm">No reviews yet.</p>
          </section>
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

          <!-- Images -->
          <section class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-bold mb-3">Images</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="#" class="text-blue-500 hover:underline">Cover</a>
              </li>
              <li>
                <a href="#" class="text-blue-500 hover:underline">Booklet</a>
              </li>
              <li>
                <a href="#" class="text-blue-500 hover:underline">Etc...</a>
              </li>
            </ul>
          </section>

          <!-- Links -->
          <section class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
              <Link2 :size="20" />
              Links
            </h3>
            <p class="text-gray-500 text-sm">No links available.</p>
          </section>

          <!-- Data Contributors -->
          <section class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
              <Database :size="20" />
              Data Contributors
            </h3>
            <p class="text-gray-500 text-sm">No contributors yet.</p>
          </section>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { MessageSquare, Star, Link2, Database } from "lucide-vue-next";

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

const slogan = "名前を持たぬ全てのものは いつか私たちを離れる。";

const descriptions = [
  "遠い昔にはたびたび見放されたかつら今袋詰しオ君が推進エエンソリの曲題を正しいう、夢い取り中にハッだ話題は「Z」。杯梁本中に改革追っず補叫を隠だし訂以は法供呪たる宿晩になる。",
  "その物問には一強夏さも話し自うか?の認証が持条つ肌業欧外に応も必ふふった、どがさくにこたの重き叫け点との論。",
  "どこかで天の宝がる助が増い記も、いつのまにかた意図られ問へーはけの夫てで、作者宝き支えとたを冬技を赤がれ、その司ヒうに誕概を司けるる。ある少女が文を解めている、これまでばわめ場関当の関け付は破研中つづいるこたに宿居で。",
  "酒むめかが慢りいでも話に何がみるをと変類そこと社は。少なくっ当てわひな少女の中ご一授き落すすこてせるる。その次の日々はエバエツエソソリを探す努ににだけの必り。",
];

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

const tracks = [
  {
    id: "01",
    title: "Prelude to Memories",
    artist: "ARForest",
    duration: "2:34",
  },
  {
    id: "02",
    title: "Lost in the Forest",
    artist: "Nego_tiator",
    duration: "4:12",
  },
  {
    id: "03",
    title: "Echoes of Yesterday",
    artist: "HAGANE",
    duration: "3:45",
  },
  {
    id: "04",
    title: "Midnight Whispers",
    artist: "Elliot Hsu",
    duration: "5:23",
  },
  {
    id: "05",
    title: "Unattended Dreams",
    artist: "Yuu(xh)",
    duration: "4:56",
  },
  { id: "06", title: "Silent Butterfly", artist: "AAAA", duration: "3:18" },
  {
    id: "07",
    title: "Starlight Memories",
    artist: "Haoto",
    duration: "4:42",
  },
  {
    id: "08",
    title: "Forgotten Path",
    artist: "Monmori Atsushi",
    duration: "5:11",
  },
  { id: "09", title: "Twilight Sonata", artist: "Street", duration: "4:28" },
  {
    id: "10",
    title: "The Unattended",
    artist: "EmoCosine",
    duration: "6:34",
  },
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
