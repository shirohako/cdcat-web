<template>
  <div
    class="min-h-screen bg-linear-to-br from-gray-50 via-pink-50 to-purple-50"
  >
    <!-- Artist Hero Section -->
    <div class="relative w-full overflow-hidden">
      <!-- Banner -->
      <div
        class="absolute inset-0"
        style="background-image: linear-gradient(109.6deg, rgba(112,246,255,0.33) 11.2%, rgba(221,108,241,0.26) 42%, rgba(229,106,253,0.71) 71.5%, rgba(123,183,253,1) 100.2%)"
      />
      <!-- Subtle dot pattern -->
      <div
        class="absolute inset-0 opacity-30"
        style="background-image: radial-gradient(circle, #60a5fa 1px, transparent 1px); background-size: 28px 28px"
      />
      <!-- Bottom fade -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-gray-50 to-transparent" />

      <!-- Content -->
      <div
        class="relative container mx-auto px-4 md:px-8 py-6 md:py-8 max-w-7xl"
      >
        <div class="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <!-- Artist Avatar -->
          <div class="relative">
            <div
              class="w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/80 flex items-center justify-center shadow-xl ring-4 ring-white text-gray-300 backdrop-blur-sm"
            >
              <Users :size="52" />
            </div>
          </div>

          <!-- Artist Info -->
          <div class="flex-1 text-center md:text-left">
            <div
              class="flex items-center justify-center md:justify-start gap-3 mb-3"
            >
              <h1
                class="text-2xl md:text-4xl font-bold bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
              >
                {{ artistData.name }}
              </h1>
            </div>
            <p class="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl">
              {{ artistData.bio }}
            </p>

            <!-- Artist Stats -->
            <div
              class="flex flex-wrap justify-center md:justify-start gap-6 mb-6"
            >
              <div
                class="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm"
              >
                <Disc3 :size="20" class="text-pink-500" />
                <span class="text-sm font-medium text-gray-700"
                  >{{ artistData.albumCount }} Albums</span
                >
              </div>
              <div
                class="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm"
              >
                <Users :size="20" class="text-purple-500" />
                <span class="text-sm font-medium text-gray-700"
                  >{{ artistData.followers }} Followers</span
                >
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap justify-center md:justify-start gap-3">
              <button
                class="btn btn-md gap-2"
                :class="isFavorited
                  ? 'bg-purple-500 text-white border-purple-500 hover:bg-purple-600'
                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'"
                :disabled="isToggling"
                @click="toggleLike"
              >
                <UserPlus :size="18" />
                {{ isFavorited ? 'Following' : 'Follow' }}
              </button>
              <button
                class="btn btn-md bg-white/60 hover:bg-white/90 border-white/80 text-gray-700 gap-2 backdrop-blur-sm"
              >
                <Share2 :size="18" />
                Share
              </button>
              <NuxtLink
                :to="`/contribute/artist/${artistId}`"
                class="btn btn-md bg-white/60 hover:bg-white/90 border-white/80 text-gray-700 gap-2 backdrop-blur-sm"
              >
                <Edit :size="18" />
                Edit
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div
      class="sticky top-16 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm"
    >
      <div class="container mx-auto px-4 md:px-8 max-w-7xl">
        <div class="flex gap-8 overflow-x-auto no-scrollbar">
          <button
            class="py-4 px-2 text-sm font-medium transition-all border-b-2 whitespace-nowrap border-purple-500 text-purple-600"
          >
            All Releases
          </button>
        </div>
      </div>
    </div>

    <!-- Albums Grid Section -->
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-7xl">
      <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-white p-6 md:p-8">
        <!-- Section Header -->
        <div class="flex items-center gap-3 mb-8">
          <div class="w-1 h-7 bg-linear-to-b from-pink-500 to-purple-500 rounded-full"></div>
          <h2 class="text-2xl font-bold text-gray-900">All Releases</h2>
          <span class="ml-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600 text-sm font-medium">{{ albums.length }}</span>
        </div>

        <!-- Albums Grid -->
        <div
          v-if="albums.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
        >
          <NuxtLink
            v-for="album in albums"
            :key="album.id"
            :to="`/works/${album.id}`"
            class="group"
          >
            <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <!-- Album Cover -->
              <div class="aspect-square bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
                <img
                  v-if="album.image_url"
                  :src="album.image_url"
                  :alt="album.title"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  style="image-rendering: -webkit-optimize-contrast;"
                />
                <div v-else class="text-gray-300">
                  <Disc3 :size="64" />
                </div>
                <div class="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <!-- Type Badge -->
                <div v-if="album.type" class="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                  {{ formatType(album.type) }}
                </div>
              </div>

              <!-- Album Info -->
              <div class="p-4 bg-white">
                <h3 class="font-bold text-base mb-2 truncate group-hover:text-blue-600 transition-colors">
                  {{ album.title }}
                </h3>

                <div class="text-xs text-gray-500 mb-3 truncate">
                  {{ album.catalog_number || '\u00A0' }}
                </div>

                <div class="space-y-2">
                  <div v-if="album.release_date" class="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar :size="14" class="text-gray-400" />
                    <span>{{ formatDate(album.release_date) }}</span>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-600">
                    <div class="flex items-center gap-1.5">
                      <Disc :size="14" class="text-gray-400" />
                      <span>{{ album.disc_count || 0 }} Disc{{ album.disc_count > 1 ? 's' : '' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <Music :size="14" class="text-gray-400" />
                      <span>{{ album.track_count || 0 }} Track{{ album.track_count > 1 ? 's' : '' }}</span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                    <div class="flex items-center gap-1.5">
                      <Eye :size="14" class="text-gray-400" />
                      <span>{{ album.views }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <Heart :size="14" :fill="album.is_favorited ? 'currentColor' : 'none'" :class="album.is_favorited ? 'text-red-500' : 'text-gray-400 group-hover:text-red-400'" class="transition-colors" />
                      <span>{{ album.likes }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mb-5">
            <Disc3 :size="36" />
          </div>
          <p class="text-gray-500 font-medium mb-1">No releases yet</p>
          <p class="text-sm text-gray-400">This artist hasn't published any releases.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Disc3,
  Disc,
  Music,
  Calendar,
  Users,
  UserPlus,
  Share2,
  Heart,
  Eye,
  Edit,
} from "lucide-vue-next";

const { isAuthenticated } = useAuth()
const { $api } = useNuxtApp()

// Get artist ID from route
const route = useRoute();
const artistId = route.params.id;

// Fetch artist data from API
const { data: artist } = await useAPI(`/v1/artists/${artistId}`);

const seoTitle = computed(() => artist.value?.name || 'Artist')
const seoDescription = computed(() => {
  const name = artist.value?.name
  if (artist.value?.bio) return artist.value.bio.slice(0, 160)
  if (name) return `Explore ${name}'s discography on CDCAT.`
  return 'Artist details on CDCAT.'
})
useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: computed(() => seoTitle.value ? `${seoTitle.value} | CDCAT` : 'CDCAT'),
  ogDescription: seoDescription,
  ogType: 'profile',
  ogImage: computed(() => artist.value?.image_url || undefined),
  twitterCard: 'summary_large_image',
})

// Favorite state
const isFavorited = ref(artist.value?.is_favorited ?? false)
const isToggling = ref(false)

const toggleLike = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  if (isToggling.value) return

  isToggling.value = true
  try {
    const result = await $api(`/v1/favorites/artists/${artistId}`, {
      method: 'POST',
    })
    isFavorited.value = result.favorited
  } catch {
    // 401 已由 api 插件处理
  } finally {
    isToggling.value = false
  }
}

// Computed artist data with fallbacks
const artistData = computed(() => ({
  name: artist.value?.name || "Loading...",
  bio: artist.value?.bio || "暂无艺术家简介。",
  albumCount: artist.value?.albums_count || 0,
  followers: artist.value?.followers_count || 0,
  since: artist.value?.active_since || "N/A",
}));

// Transform works data from API to album format
const albums = computed(() => {
  if (!artist.value?.works) return [];

  return artist.value.works.map((work) => ({
    id: work.id,
    title: work.title,
    image_url: work.image_url,
    type: work.type || "album",
    catalog_number: work.catalog_number,
    release_date: work.release_date,
    disc_count: work.disc_count || 0,
    track_count: work.track_count || 0,
    is_favorited: work.is_favorited ?? false,
    likes: work.favorites_count || 0,
    views: work.views_count || 0,
  }));
});

const formatType = (type) => {
  const typeMap = { album: "Album", single: "Single", ep: "EP", compilation: "Compilation" };
  return typeMap[type] || type;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
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
