<template>
  <div
    class="min-h-screen bg-linear-to-br from-gray-50 via-pink-50 to-purple-50"
  >
    <!-- Artist Hero Section -->
    <div class="relative w-full overflow-hidden bg-white/60 backdrop-blur-sm">
      <!-- Background Pattern -->
      <div
        class="absolute inset-0 opacity-10"
        style="
          background-image: radial-gradient(
            circle,
            #ec4899 1px,
            transparent 1px
          );
          background-size: 24px 24px;
        "
      />

      <!-- Content -->
      <div
        class="relative container mx-auto px-4 md:px-8 py-12 md:py-20 max-w-7xl"
      >
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
            <div
              class="flex items-center justify-center md:justify-start gap-3 mb-3"
            >
              <h1
                class="text-4xl md:text-6xl font-bold bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
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
    <div class="container mx-auto px-4 md:px-8 py-12 max-w-7xl">
      <!-- Section Header -->
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-3xl font-bold text-gray-900">All Releases</h2>
      </div>

      <!-- Albums Grid -->
      <div
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
      >
        <NuxtLink
          v-for="album in albums"
          :key="album.id"
          :to="`/works/${album.id}`"
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

              <!-- Artist Info (Clickable) -->
              <div
                v-for="albumArtist in album.artists"
                :key="albumArtist.id"
                class="flex items-center gap-1.5 mb-2 text-xs text-gray-600 hover:text-purple-600 transition-colors w-fit"
              >
                <Users :size="12" />
                <span class="truncate font-medium">{{ albumArtist.name }}</span>
              </div>

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
        </NuxtLink>
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

// Get artist ID from route
const route = useRoute();
const artistId = route.params.id;

// Fetch artist data from API
const { data: artist } = await useAPI(`/v1/artists/${artistId}`);

// Computed artist data with fallbacks
const artistData = computed(() => ({
  name: artist.value?.name || "Loading...",
  bio: "",
  avatar:
    artist.value?.image_url ||
    "https://i.psray.net/i/2025/12/04/69318b0e98cbe.jpg",
  albumCount: artist.value?.albums_count || 0,
  followers: artist.value?.followers_count || 0,
  since: artist.value?.active_since || "N/A",
}));

// Transform works data from API to album format
const albums = computed(() => {
  if (!artist.value?.works) return [];

  return artist.value.works.map((work) => {
    // Extract year from release_date
    const year = work.release_date
      ? new Date(work.release_date).getFullYear().toString()
      : "N/A";

    // Format the disc and track info
    const discInfo = `${work.disc_count} CD`;
    const format = `${discInfo} • ${work.track_count} Tracks`;

    return {
      id: work.id,
      title: work.title,
      cover:
        work.image_url || "https://i.psray.net/i/2025/12/04/69318b0e98cbe.jpg",
      year: year,
      format: format,
      type: work.type || "album",
      artists: work.artists || [], // Include artists data
      likes: work.favorites_count || 0,
      views: work.views_count || 0,
    };
  });
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
