<template>
  <div class="min-h-screen bg-base-100">
    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center min-h-screen">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="alert alert-error max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Failed to load: {{ error.message }}</span>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Hero Section -->
      <div class="relative w-full h-100 overflow-hidden">
        <!-- Background Image or Gradient -->
        <div class="absolute inset-0">
          <img
            v-if="entryData.banner_url"
            :src="entryData.banner_url"
            :alt="entryData.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="hero-gradient"></div>
          <!-- Gradient Overlay -->
          <div class="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent"></div>
        </div>

        <!-- Hero Content -->
        <div class="container mx-auto px-4 md:px-8 max-w-7xl h-full relative z-10">
          <div class="flex items-end h-full pb-8">
            <div class="flex flex-col md:flex-row gap-6 items-end">
              <!-- Poster -->
              <div class="w-48 shrink-0">
                <div class="aspect-2/3 rounded-xl shadow-2xl overflow-hidden border-4 border-white/10">
                  <img
                    v-if="entryData.image_url"
                    :src="entryData.image_url"
                    :alt="entryData.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full bg-gray-700 flex items-center justify-center">
                    <Film :size="64" class="text-gray-500" />
                  </div>
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 text-white pb-4">
                <!-- Type Badge -->
                <div class="mb-3">
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
                    <Icon :name="getTypeIcon(entryData.type)" class="w-4 h-4" />
                    {{ formatType(entryData.type) }}
                  </span>
                </div>

                <!-- Title -->
                <h1 class="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                  {{ entryData.title }}
                </h1>

                <!-- Meta Info -->
                <div class="flex flex-wrap gap-4 text-lg text-white/90 mb-4">
                  <div v-if="entryData.year" class="flex items-center gap-2">
                    <Calendar :size="20" />
                    <span>{{ entryData.year }}</span>
                  </div>
                  <div v-if="entryData.release_date" class="flex items-center gap-2">
                    <Clock :size="20" />
                    <span>{{ formatDate(entryData.release_date) }}</span>
                  </div>
                  <div v-if="entryData.status" class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-white/20 text-sm">{{ entryData.status }}</span>
                  </div>
                </div>

                <!-- Quick Stats -->
                <div class="flex gap-6 text-white/80">
                  <div class="flex items-center gap-2">
                    <Eye :size="18" />
                    <span>{{ entryData.views_count || 0 }} views</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Heart :size="18" />
                    <span>{{ entryData.favorites_count || 0 }} favorites</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Music2 :size="18" />
                    <span>{{ entryData.works_count || 0 }} music works</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column - Main Content -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Description -->
            <div v-if="entryData.description" class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
                <Info :size="24" />
                Description
              </h2>
              <div class="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {{ entryData.description }}
              </div>
            </div>

            <!-- Related Music Works -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
                <Music2 :size="24" />
                Related Music Works
                <span v-if="relatedWorks.length > 0" class="text-lg font-normal text-gray-500">
                  ({{ relatedWorks.length }})
                </span>
              </h2>

              <!-- Works Grid -->
              <div v-if="relatedWorks.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <NuxtLink
                  v-for="work in relatedWorks"
                  :key="work.id"
                  :to="`/works/${work.id}`"
                  class="group"
                >
                  <div class="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-200">
                    <!-- Album Cover -->
                    <div class="aspect-square bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      <img
                        v-if="work.image_url"
                        :src="work.image_url"
                        :alt="work.title"
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div v-else class="text-gray-400">
                        <Disc :size="48" />
                      </div>
                    </div>

                    <!-- Work Info -->
                    <div class="p-3">
                      <h3 class="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                        {{ work.title }}
                      </h3>
                      <p v-if="work.release_date" class="text-xs text-gray-500">
                        {{ formatDate(work.release_date) }}
                      </p>
                    </div>
                  </div>
                </NuxtLink>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-8 text-gray-500">
                <Disc :size="48" class="mx-auto mb-3 text-gray-300" />
                <p>No related music works yet</p>
              </div>
            </div>

            <!-- External Links -->
            <div v-if="entryData.links && entryData.links.length > 0" class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
                <ExternalLink :size="24" />
                External Links
              </h2>
              <div class="space-y-2">
                <a
                  v-for="link in entryData.links"
                  :key="link.id"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <ExternalLink :size="18" class="text-gray-400 group-hover:text-blue-600" />
                  <span class="flex-1 text-gray-700 group-hover:text-blue-600">{{ link.name || link.url }}</span>
                  <Icon name="lucide:arrow-up-right" class="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </a>
              </div>
            </div>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Basic Info Card -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 class="text-lg font-bold mb-4">Information</h3>
              <div class="space-y-3">
                <div v-if="entryData.type">
                  <div class="text-sm text-gray-500 mb-1">Type</div>
                  <div class="font-medium">{{ formatType(entryData.type) }}</div>
                </div>
                <div v-if="entryData.year">
                  <div class="text-sm text-gray-500 mb-1">Year</div>
                  <div class="font-medium">{{ entryData.year }}</div>
                </div>
                <div v-if="entryData.release_date">
                  <div class="text-sm text-gray-500 mb-1">Release Date</div>
                  <div class="font-medium">{{ formatDate(entryData.release_date) }}</div>
                </div>
                <div v-if="entryData.status">
                  <div class="text-sm text-gray-500 mb-1">Status</div>
                  <div class="font-medium">{{ entryData.status }}</div>
                </div>
              </div>
            </div>

            <!-- Stats Card -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 class="text-lg font-bold mb-4">Statistics</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-gray-600">
                    <Eye :size="18" />
                    <span>Views</span>
                  </div>
                  <span class="font-bold text-lg">{{ entryData.views_count || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-gray-600">
                    <Heart :size="18" />
                    <span>Favorites</span>
                  </div>
                  <span class="font-bold text-lg">{{ entryData.favorites_count || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-gray-600">
                    <Music2 :size="18" />
                    <span>Music Works</span>
                  </div>
                  <span class="font-bold text-lg">{{ entryData.works_count || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Links Card -->
            <div v-if="entryData.bangumi_id" class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 class="text-lg font-bold mb-4">Quick Links</h3>
              <div class="space-y-2">
                <a
                  :href="`https://bgm.tv/subject/${entryData.bangumi_id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-200"
                >
                  <Icon name="lucide:external-link" class="w-5 h-5 text-pink-500" />
                  <span class="flex-1 font-medium text-gray-700 group-hover:text-pink-600">View on Bangumi</span>
                  <Icon name="lucide:arrow-up-right" class="w-4 h-4 text-gray-400 group-hover:text-pink-600" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Film, Calendar, Clock, Heart, Eye, Music2, Info, ExternalLink, Disc } from "lucide-vue-next";

// Get route params
const route = useRoute();
const entryId = route.params.id;

// Fetch entry data from API
const { data: entryResponse, pending, error } = await useAPI(`/v1/entries/${entryId}`);

// Process entry data
const entryData = computed(() => {
  if (!entryResponse.value) {
    return {
      name: "",
      type: "",
      year: null,
      release_date: "",
      status: "",
      description: "",
      image_url: "",
      banner_url: "",
      views_count: 0,
      favorites_count: 0,
      works_count: 0,
      links: [],
      meta: {},
    };
  }

  const entry = entryResponse.value;
  const meta = entry.meta || {};

  // Extract year from release_date
  const year = entry.release_date ? new Date(entry.release_date).getFullYear() : null;

  return {
    id: entry.id,
    name: entry.name,
    title: entry.name,
    type: entry.type,
    year: year,
    release_date: entry.release_date,
    status: meta.platform || "",
    description: meta.description || "",
    image_url: meta.image_url || "",
    banner_url: meta.banner_url || meta.image_url || "",
    views_count: entry.views_count || 0,
    favorites_count: entry.favorites_count || 0,
    works_count: entry.works_count || 0,
    links: entry.links || [],
    bangumi_id: meta.bangumi_id || null,
    meta: meta,
  };
});

// Related music works
const relatedWorks = computed(() => {
  return entryData.value.works || [];
});

// Get type icon
const getTypeIcon = (type) => {
  const iconMap = {
    anime: 'lucide:sparkles',
    movie: 'lucide:film',
    tv: 'lucide:tv',
    game: 'lucide:gamepad-2',
    other: 'lucide:box',
  };
  return iconMap[type] || 'lucide:box';
};

// Format entry type
const formatType = (type) => {
  const typeMap = {
    anime: "Anime",
    movie: "Movie",
    tv: "TV Show",
    game: "Game",
    other: "Other",
  };
  return typeMap[type] || type;
};

// Format date
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
.hero-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #4facfe 75%,
    #00f2fe 100%
  );
  animation: gradientShift 15s ease infinite;
  background-size: 400% 400%;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
