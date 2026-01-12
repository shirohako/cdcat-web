<template>
  <div class="relative w-full overflow-hidden bg-white">
    <!-- Background Image -->
    <img
      :src="albumData.backgroundImage"
      alt="Background"
      class="absolute inset-0 w-full h-full object-cover opacity-30"
    />

    <!-- Content Container -->
    <div
      class="relative container mx-auto px-4 md:px-8 pt-8 md:pt-16 pb-8 md:pb-16 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 max-w-7xl"
    >
      <!-- Album Cover -->
      <div class="shrink-0">
        <img
          :src="albumData.coverImage"
          :alt="albumData.title"
          class="w-70 h-70 sm:w-[320px] sm:h-80 md:w-100 md:h-100 xl:w-112.5 xl:h-112.5 2xl:w-125 2xl:h-125 object-cover shadow-2xl"
        />
      </div>

      <!-- Album Info Box with Frosted Glass Effect -->
      <div class="flex-1 flex items-stretch w-full md:w-auto">
        <div
          class="backdrop-blur-[4.45px] rounded-lg p-6 md:p-8 flex flex-col justify-between w-full md:h-100 xl:h-112.5 2xl:h-125"
          style="opacity: 0.94; background-color: rgba(198, 175, 175, 0.3)"
        >
          <div class="flex-1">
            <h1 class="text-3xl md:text-5xl font-bold mb-2 md:mb-3 text-gray-900">
              {{ albumData.title }}
            </h1>
            <p class="text-lg md:text-xl text-gray-700 mb-4 md:mb-6">
              <template v-for="(artist, index) in albumData.artists" :key="artist.id">
                <NuxtLink
                  :to="`/artists/${artist.id}`"
                  class="hover:underline hover:text-gray-900 transition-colors"
                >
                  {{ artist.pivot?.display_name || artist.name }}
                </NuxtLink>
                <span v-if="index < albumData.artists.length - 1">, </span>
              </template>
            </p>

            <div class="space-y-2 text-gray-800 text-sm md:text-base">
              <div class="flex items-center gap-2">
                <Calendar :size="18" class="text-gray-600" />
                <span>{{ albumData.releaseDate }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Disc3 :size="18" class="text-gray-600" />
                <span>{{ albumData.format }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Hash :size="18" class="text-gray-600" />
                <span>{{ albumData.catalogNumber }}</span>
              </div>
              <div v-if="albumData.price" class="flex items-center gap-2 text-lg mt-2">
                <BadgeJapaneseYen :size="20" class="text-gray-600" />
                <span>{{ albumData.price }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2 mt-6 md:mt-0">
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                class="btn btn-sm md:btn-md btn-outline border-red-400 text-red-600 hover:bg-red-50 gap-2"
              >
                <Heart :size="18" />
                Like
              </button>

              <button
                class="btn btn-sm md:btn-md bg-blue-500 hover:bg-blue-600 text-white border-0 gap-2"
              >
                <ListPlus :size="18" />
                Add to Mylist
              </button>
            </div>
            <div class="flex gap-2 sm:gap-3">
              <button
                class="btn btn-sm md:btn-md bg-black hover:bg-gray-800 text-white border-0 gap-2 flex-1 md:flex-none md:w-48"
              >
                <ShoppingCart :size="18" />
                Buy it
              </button>

              <!-- Edit Button -->
              <NuxtLink
                v-if="workId"
                :to="isAuthenticated ? `/contribute/work/${workId}` : `/auth/login?redirect=/contribute/work/${workId}`"
                class="btn btn-sm md:btn-md btn-outline border-gray-400 text-gray-700 hover:bg-gray-50 gap-2 flex-1 md:flex-none md:w-auto"
              >
                <Edit :size="18" />
                <span class="hidden sm:inline">Edit</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Heart,
  ListPlus,
  ShoppingCart,
  Calendar,
  Disc3,
  Hash,
  BadgeJapaneseYen,
  Edit,
} from "lucide-vue-next";

const { isAuthenticated } = useAuth()

defineProps({
  albumData: {
    type: Object,
    required: true,
  },
  workId: {
    type: [String, Number],
    default: null,
  },
});
</script>
