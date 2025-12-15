<template>
  <div class="min-h-screen bg-base-100">
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
          <AlbumArtistCard
            :name="artist.name"
            :since="artist.since"
            :discography="artist.discography"
            :credits-count="artist.creditsCount"
            :categories="artist.categories"
            :extra="artist.extra"
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
</template>

<script setup>
import { MessageSquare, Star, Link2, Database } from "lucide-vue-next";

// Mock data - can be replaced with API calls later
const albumData = {
  title: "The Unattended",
  label: "#ffffff Records",
  releaseDate: "2022-01-01 (M3 2022 冬)",
  format: "2CD | 30 Tracks",
  catalogNumber: "HXN-001 ~ 002",
  price: "¥3,000 (Event)",
  coverImage: "https://i.psray.net/i/2025/12/04/69318b0e98cbe.jpg",
  backgroundImage: "https://i.psray.net/i/2025/12/04/69318adbef5ed.jpg",
};

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

const artist = {
  name: "#ffffff Records",
  since: "2018",
  discography: 3,
  creditsCount: 123,
  categories: "Game, Animation, Publication",
  extra:
    "Doujin/Indie, Electronic/Promo, Doujin/Indie, Delayed/Cancelled, Bootleg",
};

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
