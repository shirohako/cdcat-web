<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">Entries</h1>
        <p class="text-gray-600">Explore anime, movies, TV shows and more</p>
      </div>

      <!-- Filter Tabs -->
      <div class="mb-6">
        <div class="tabs tabs-boxed inline-flex">
          <a
            v-for="type in entryTypes"
            :key="type.value"
            :class="['tab', selectedType === type.value ? 'tab-active' : '']"
            @click="selectType(type.value)"
          >
            <Icon :name="type.icon" class="w-4 h-4 mr-2" />
            {{ type.label }}
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="flex items-center justify-center min-h-100">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center min-h-100">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load: {{ error.message }}</span>
        </div>
      </div>

      <!-- Entries Content -->
      <div v-else>
        <!-- Stats -->
        <div class="mb-6 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Found {{ pagination.total }} entries
            <span v-if="pagination.total > 0" class="text-gray-500">
              (Page {{ pagination.current_page }} of {{ pagination.last_page }})
            </span>
          </div>
        </div>

        <!-- Entry List -->
        <div class="space-y-4">
          <NuxtLink
            v-for="entry in entriesData"
            :key="entry.id"
            :to="`/entries/${entry.id}`"
            class="group block"
          >
            <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div class="flex gap-4 p-4">
                <!-- Poster Image -->
                <div class="w-24 h-36 shrink-0 bg-linear-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden relative">
                  <img
                    v-if="getEntryImageUrl(entry)"
                    :src="getEntryImageUrl(entry)"
                    :alt="getEntryTitle(entry)"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    style="image-rendering: -webkit-optimize-contrast;"
                  />
                  <div v-else class="flex items-center justify-center h-full text-gray-300">
                    <Film :size="40" />
                  </div>

                  <!-- Type Badge -->
                  <div v-if="entry.type" class="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                    {{ formatType(entry.type) }}
                  </div>
                </div>

                <!-- Entry Info -->
                <div class="flex-1 min-w-0 flex flex-col justify-between">
                  <!-- Top Section -->
                  <div>
                    <!-- Title and Year -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <h3 class="font-bold text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                        {{ getEntryTitle(entry) }}
                      </h3>
                      <span v-if="getEntryYear(entry)" class="shrink-0 px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm font-medium">
                        {{ getEntryYear(entry) }}
                      </span>
                    </div>

                    <!-- Description (if available) -->
                    <p v-if="getEntryDescription(entry)" class="text-sm text-gray-600 line-clamp-2 mb-3">
                      {{ getEntryDescription(entry) }}
                    </p>
                  </div>

                  <!-- Bottom Section - Meta Info -->
                  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <!-- Release Date -->
                    <div v-if="entry.release_date" class="flex items-center gap-1.5">
                      <Calendar :size="16" class="text-gray-400" />
                      <span>{{ formatDate(entry.release_date) }}</span>
                    </div>

                    <!-- Related Works Count -->
                    <div v-if="entry.works_count !== undefined" class="flex items-center gap-1.5">
                      <Music2 :size="16" class="text-gray-400" />
                      <span>{{ entry.works_count }} Music Work{{ entry.works_count !== 1 ? 's' : '' }}</span>
                    </div>

                    <!-- Stats -->
                    <div class="flex items-center gap-4 ml-auto">
                      <div class="flex items-center gap-1.5">
                        <Eye :size="16" class="text-gray-400" />
                        <span>{{ entry.views_count || 0 }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <Heart :size="16" class="text-gray-400 group-hover:text-red-400 transition-colors" />
                        <span>{{ entry.favorites_count || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-if="entriesData.length === 0" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <Film :size="64" class="mx-auto" />
          </div>
          <p class="text-gray-500">No entries found</p>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="mt-12 flex justify-center">
          <div class="join">
            <!-- Previous Button -->
            <button
              class="join-item btn btn-sm"
              :disabled="pagination.current_page === 1"
              @click="goToPage(pagination.current_page - 1)"
            >
              «
            </button>

            <!-- Page Numbers -->
            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                class="join-item btn btn-sm"
                :class="{ 'btn-active': page === pagination.current_page }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button
                v-else
                class="join-item btn btn-sm btn-disabled"
              >
                ...
              </button>
            </template>

            <!-- Next Button -->
            <button
              class="join-item btn btn-sm"
              :disabled="pagination.current_page === pagination.last_page"
              @click="goToPage(pagination.current_page + 1)"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Film, Calendar, Heart, Eye, Music2 } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

// Entry types
const entryTypes = [
  { value: 'all', label: 'All', icon: 'lucide:grid-3x3' },
  { value: 'anime', label: 'Anime', icon: 'lucide:sparkles' },
  { value: 'movie', label: 'Movie', icon: 'lucide:film' },
  { value: 'tv', label: 'TV Show', icon: 'lucide:tv' },
  { value: 'game', label: 'Game', icon: 'lucide:gamepad-2' },
  { value: 'other', label: 'Other', icon: 'lucide:more-horizontal' }
];

// Selected type
const selectedType = ref(route.query.type || 'all');

// Current page
const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

// Fetch entries from API
const { data: entriesResponse, pending, error } = await useAPI("/v1/entries", {
  query: computed(() => ({
    page: currentPage.value,
    type: selectedType.value === 'all' ? undefined : selectedType.value
  })),
});

// Process entries data
const entriesData = computed(() => {
  if (!entriesResponse.value) {
    return [];
  }

  // API plugin auto-unwraps the `data` field from { success: true, data: {...} }
  const response = entriesResponse.value;

  // If it's an array, return directly
  if (Array.isArray(response)) {
    return response;
  }

  // If it's an object, look for entries or data array
  return response.entries || response.data || [];
});

// Pagination info
const pagination = computed(() => {
  if (!entriesResponse.value) {
    return {
      total: 0,
      per_page: 24,
      current_page: 1,
      last_page: 1,
    };
  }

  const response = entriesResponse.value;

  // If response is an array, no pagination info
  if (Array.isArray(response)) {
    return {
      total: response.length,
      per_page: response.length,
      current_page: 1,
      last_page: 1,
    };
  }

  // Look for pagination in response.pagination or response.meta
  const paginationData = response.pagination || response.meta;

  if (!paginationData) {
    return {
      total: 0,
      per_page: 24,
      current_page: 1,
      last_page: 1,
    };
  }

  return paginationData;
});

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

// Helper functions to extract data from different API response formats
const getEntryTitle = (entry) => {
  const meta = entry.meta || {};
  return meta.bangumi_name_cn || meta.bangumi_name || entry.name || entry.title || "";
};

const getEntryYear = (entry) => {
  if (entry.year) return entry.year;
  if (entry.release_date) {
    return new Date(entry.release_date).getFullYear();
  }
  return null;
};

const getEntryDescription = (entry) => {
  const meta = entry.meta || {};
  return meta.description || entry.description || "";
};

const getEntryImageUrl = (entry) => {
  const meta = entry.meta || {};
  return meta.image_url || entry.image_url || "";
};

// Calculate visible pages
const visiblePages = computed(() => {
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  const pages = [];

  if (last <= 7) {
    for (let i = 1; i <= last; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (current > 3) {
      pages.push('...');
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < last - 2) {
      pages.push('...');
    }
    pages.push(last);
  }

  return pages;
});

// Go to page
const goToPage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return;
  router.push({
    query: {
      ...route.query,
      page: page === 1 ? undefined : page,
    },
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Select type filter
const selectType = (type) => {
  selectedType.value = type;
  router.push({
    query: {
      type: type === 'all' ? undefined : type,
      page: undefined, // Reset to first page
    },
  });
};
</script>
