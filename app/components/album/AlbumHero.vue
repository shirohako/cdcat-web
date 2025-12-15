<template>
  <div class="relative w-full overflow-hidden bg-white">
    <!-- Background Image -->
    <img
      :src="backgroundImage"
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
          :src="coverImage"
          :alt="title"
          class="w-[280px] h-[280px] sm:w-[320px] sm:h-80 md:w-[400px] md:h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[500px] 2xl:h-[500px] object-cover shadow-2xl"
        />
      </div>

      <!-- Album Info Box with Frosted Glass Effect -->
      <div class="flex-1 flex items-stretch w-full md:w-auto">
        <div
          class="backdrop-blur-[4.45px] rounded-lg p-6 md:p-8 flex flex-col justify-between w-full md:h-[400px] xl:h-[450px] 2xl:h-[500px]"
          style="opacity: 0.94; background-color: rgba(198, 175, 175, 0.3)"
        >
          <div class="flex-1">
            <h1 class="text-3xl md:text-5xl font-bold mb-2 md:mb-3 text-gray-900">
              {{ title }}
            </h1>
            <p class="text-lg md:text-xl text-gray-700 mb-4 md:mb-6">{{ label }}</p>

            <div class="space-y-2 text-gray-800 text-sm md:text-base">
              <div class="flex items-center gap-2">
                <Calendar :size="18" class="text-gray-600" />
                <span>{{ releaseDate }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Disc3 :size="18" class="text-gray-600" />
                <span>{{ format }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Hash :size="18" class="text-gray-600" />
                <span>{{ catalogNumber }}</span>
              </div>
              <div v-if="price" class="flex items-center gap-2 text-lg mt-2">
                <BadgeJapaneseYen :size="20" class="text-gray-600" />
                <span>{{ price }}</span>
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
            <div class="flex gap-3">
              <button
                class="btn btn-sm md:btn-md bg-black hover:bg-gray-800 text-white border-0 gap-2 w-full md:w-60"
              >
                <ShoppingCart :size="18" />
                Buy it
              </button>
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
} from "lucide-vue-next";

defineProps({
  title: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  releaseDate: {
    type: String,
    required: true,
  },
  format: {
    type: String,
    required: true,
  },
  catalogNumber: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    default: "",
  },
  coverImage: {
    type: String,
    required: true,
  },
  backgroundImage: {
    type: String,
    required: true,
  },
});
</script>
