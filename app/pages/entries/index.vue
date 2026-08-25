<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
      <CollectionPageHeader
        v-model="selectedType"
        :title="$t('menu.entry')"
        :description="$t('content_display.entry_desc')"
        icon="lucide:panels-top-left"
        tone="rose"
        :filters="entryTypes"
        :filter-label="$t('content_display.type')"
        @update:model-value="selectType"
      >
        <template #action>
          <button
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
            @click="navigateTo('/contribute/entry')"
          >
            <Plus class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{ $t('common.new') }}</span>
          </button>
        </template>
      </CollectionPageHeader>
        </template>

      <!-- Loading State -->
      <CollectionLoadingSkeleton v-if="pending" variant="list" />

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
      <div v-else class="collection-content-enter">
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
        <div v-if="entriesData.length === 0" class="flex min-h-72 flex-col items-center justify-center text-center">
          <div class="text-gray-400 mb-4">
            <Film :size="64" class="mx-auto" />
          </div>
          <p class="text-gray-500">No entries found</p>
        </div>

        <CommonPagination
          class="mt-6"
          :page="pagination.current_page"
          :total-pages="pagination.last_page"
          :disabled="pending"
          @update:page="goToPage"
        />
      </div>
      </CollectionPageCard>
    </div>
  </div>
</template>

<script setup>
import { Film, Calendar, Heart, Eye, Music2, Plus } from "@lucide/vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// Entry types
const entryTypes = computed(() => [
  { value: 'all', label: t('common.all'), icon: 'lucide:layout-grid' },
  { value: 'anime', label: t('content_display.entry_type.anime'), icon: 'lucide:sparkles' },
  { value: 'movie', label: t('content_display.entry_type.movie'), icon: 'lucide:film' },
  { value: 'tv', label: t('content_display.entry_type.tv'), icon: 'lucide:tv' },
  { value: 'game', label: t('content_display.entry_type.game'), icon: 'lucide:gamepad-2' },
  { value: 'other', label: t('content_display.entry_type.other'), icon: 'lucide:shapes' }
]);

// Selected type
const selectedType = ref(route.query.type || 'all');

// Current page
const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

// Fetch entries from API
const { data: entriesResponse, pending, error } = useAPI("/v1/entries", {
  lazy: true,
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
    anime: t('content_display.entry_type.anime'),
    movie: t('content_display.entry_type.movie'),
    tv: t('content_display.entry_type.tv'),
    game: t('content_display.entry_type.game'),
    other: t('content_display.entry_type.other'),
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
  return entry.image_url || "";
};

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
