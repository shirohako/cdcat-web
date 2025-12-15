<template>
  <div class="min-h-screen bg-linear-to-br from-gray-50 via-pink-50 to-purple-50">
    <!-- Artist Hero Section -->
    <div class="relative w-full overflow-hidden bg-white/60 backdrop-blur-sm">
      <!-- Background Pattern -->
      <div
        class="absolute inset-0 opacity-10"
        style="background-image: radial-gradient(circle, #ec4899 1px, transparent 1px); background-size: 24px 24px;"
      />

      <!-- Content -->
      <div class="relative container mx-auto px-4 md:px-8 py-12 md:py-20 max-w-7xl">
        <div class="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <!-- Artist Avatar -->
          <div class="relative group">
            <div
              class="absolute -inset-1 bg-linear-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500"
            />
            <div class="relative">
              <img
                :src="artistData.avatar"
                :alt="artistData.name"
                class="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover shadow-2xl ring-4 ring-white"
              />
              <!-- Online Status Indicator -->
              <div
                class="absolute bottom-4 right-4 w-6 h-6 bg-green-400 rounded-full ring-4 ring-white"
              />
            </div>
          </div>

          <!-- Artist Info -->
          <div class="flex-1 text-center md:text-left">
            <h1
              class="text-4xl md:text-6xl font-bold mb-3 bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
            >
              {{ artistData.name }}
            </h1>
            <p class="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl">
              {{ artistData.bio }}
            </p>

            <!-- Artist Stats -->
            <div
              class="flex flex-wrap justify-center md:justify-start gap-6 mb-6"
            >
              <div
                class="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
              >
                <Disc3 :size="20" class="text-pink-500" />
                <span class="text-sm font-medium text-gray-700"
                  >{{ artistData.albumCount }} Albums</span
                >
              </div>
              <div
                class="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
              >
                <Users :size="20" class="text-purple-500" />
                <span class="text-sm font-medium text-gray-700"
                  >{{ artistData.followers }} Followers</span
                >
              </div>
              <div
                class="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
              >
                <Calendar :size="20" class="text-blue-500" />
                <span class="text-sm font-medium text-gray-700"
                  >Since {{ artistData.since }}</span
                >
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap justify-center md:justify-start gap-3">
              <button
                class="btn btn-md bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 gap-2 shadow-lg"
              >
                <UserPlus :size="18" />
                Follow
              </button>
              <button
                class="btn btn-md btn-outline border-gray-300 hover:bg-gray-50 gap-2"
              >
                <Share2 :size="18" />
                Share
              </button>
              <button
                class="btn btn-md btn-outline border-gray-300 hover:bg-gray-50 gap-2"
              >
                <Heart :size="18" />
                Like
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="sticky top-16 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div class="container mx-auto px-4 md:px-8 max-w-7xl">
        <div class="flex gap-8 overflow-x-auto no-scrollbar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'py-4 px-2 text-sm font-medium transition-all border-b-2 whitespace-nowrap',
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
            ]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Albums Grid Section -->
    <div class="container mx-auto px-4 md:px-8 py-12 max-w-7xl">
      <!-- Section Header -->
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-3xl font-bold text-gray-900">
          {{ activeTab === 'albums' ? 'Albums' : activeTab === 'singles' ? 'Singles' : 'All Releases' }}
        </h2>

        <!-- Sort & Filter -->
        <div class="flex gap-3">
          <select class="select select-sm select-bordered">
            <option>Latest</option>
            <option>Popular</option>
            <option>A-Z</option>
          </select>
        </div>
      </div>

      <!-- Albums Grid -->
      <div
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
      >
        <div
          v-for="album in filteredAlbums"
          :key="album.id"
          class="group cursor-pointer"
        >
          <!-- Album Card -->
          <div
            class="relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <!-- Album Cover -->
            <div class="relative aspect-square overflow-hidden">
              <img
                :src="album.cover"
                :alt="album.title"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />

              <!-- Hover Overlay -->
              <div
                class="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4"
              >
                <button
                  class="btn btn-sm bg-white/90 hover:bg-white text-gray-900 border-0 gap-2"
                >
                  <Play :size="16" />
                  查看
                </button>
              </div>

              <!-- Release Year Badge -->
              <div
                class="absolute top-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-md"
              >
                {{ album.year }}
              </div>
            </div>

            <!-- Album Info -->
            <div class="p-4">
              <h3
                class="font-bold text-gray-900 mb-1 truncate group-hover:text-purple-600 transition-colors"
              >
                {{ album.title }}
              </h3>
              <p class="text-sm text-gray-500 mb-2">{{ album.format }}</p>

              <!-- Mini Stats -->
              <div class="flex items-center gap-3 text-xs text-gray-400">
                <div class="flex items-center gap-1">
                  <Heart :size="12" />
                  {{ album.likes }}
                </div>
                <div class="flex items-center gap-1">
                  <Eye :size="12" />
                  {{ album.views }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Disc3,
  Users,
  Calendar,
  UserPlus,
  Share2,
  Heart,
  Play,
  Eye,
} from "lucide-vue-next";

// Active tab state
const activeTab = ref("all");

// Navigation tabs
const tabs = [
  { id: "all", label: "All Releases" },
  { id: "albums", label: "Albums" },
  { id: "singles", label: "Singles" },
  { id: "compilations", label: "Compilations" },
];

// Mock artist data
const artistData = {
  name: "#ffffff Records",
  bio: "An independent music label specializing in electronic and game music. Creating beautiful soundscapes since 2018.",
  avatar: "https://i.psray.net/i/2025/12/04/69318b0e98cbe.jpg",
  albumCount: 24,
  followers: "12.5k",
  since: "2018",
};

// Mock albums data
const albums = [
  {
    id: 1,
    title: "The Unattended",
    cover: "https://i.psray.net/i/2025/12/04/69318b0e98cbe.jpg",
    year: "2022",
    format: "2CD • 30 Tracks",
    type: "album",
    likes: 342,
    views: "15k",
  },
  {
    id: 2,
    title: "Stellar Dreams",
    cover: "https://i.psray.net/i/2025/12/04/69318adbef5ed.jpg",
    year: "2023",
    format: "CD • 12 Tracks",
    type: "album",
    likes: 256,
    views: "8.2k",
  },
  {
    id: 3,
    title: "Moonlight Sonata",
    cover: "https://i.psray.net/i/2025/12/04/69318b0e98cbe.jpg",
    year: "2023",
    format: "Digital • 8 Tracks",
    type: "single",
    likes: 189,
    views: "5.4k",
  },
  {
    id: 4,
    title: "Neon Nights",
    cover: "https://i.psray.net/i/2025/12/04/69318adbef5ed.jpg",
    year: "2024",
    format: "CD • 15 Tracks",
    type: "album",
    likes: 421,
    views: "22k",
  },
  {
    id: 5,
    title: "Ethereal Voices",
    cover: "https://i.psray.net/i/2025/12/04/69318b0e98cbe.jpg",
    year: "2024",
    format: "Digital • 6 Tracks",
    type: "single",
    likes: 167,
    views: "4.1k",
  },
  {
    id: 6,
    title: "Cosmic Journey",
    cover: "https://i.psray.net/i/2025/12/04/69318adbef5ed.jpg",
    year: "2021",
    format: "2CD • 24 Tracks",
    type: "compilation",
    likes: 512,
    views: "28k",
  },
  {
    id: 7,
    title: "Aurora Borealis",
    cover: "https://i.psray.net/i/2024/04/24/662808d3009cd.jpg",
    year: "2022",
    format: "CD • 10 Tracks",
    type: "album",
    likes: 298,
    views: "11k",
  },
  {
    id: 8,
    title: "Digital Horizons",
    cover: "https://i.psray.net/i/2024/05/09/663c0678de0e8.jpg",
    year: "2023",
    format: "Digital • 5 Tracks",
    type: "single",
    likes: 145,
    views: "3.8k",
  },
  {
    id: 9,
    title: "Sakura Memories",
    cover: "https://i.psray.net/i/2025/12/04/69318b0e98cbe.jpg",
    year: "2024",
    format: "CD • 14 Tracks",
    type: "album",
    likes: 634,
    views: "35k",
  },
  {
    id: 10,
    title: "Twilight Echo",
    cover: "https://i.psray.net/i/2025/12/04/69318adbef5ed.jpg",
    year: "2024",
    format: "Digital • 7 Tracks",
    type: "single",
    likes: 223,
    views: "6.7k",
  },
];

// Filtered albums based on active tab
const filteredAlbums = computed(() => {
  if (activeTab.value === "all") {
    return albums;
  }
  return albums.filter((album) => album.type === activeTab.value.slice(0, -1));
});
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
