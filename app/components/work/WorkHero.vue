<template>
  <div class="relative w-full overflow-hidden bg-white">
    <!-- Background Image -->
    <img
      :src="albumData.backgroundImage"
      alt="Background"
      class="absolute inset-0 w-full h-full object-cover opacity-30"
    />

    <!-- Content Container -->
    <div class="relative container mx-auto px-4 md:px-12 lg:px-20 xl:px-8 pb-7 md:py-10 max-w-7xl">
      <div class="flex flex-col items-center md:flex-row md:items-stretch gap-6 md:gap-10 max-w-5xl mx-auto">

        <!-- Album Cover -->
        <div class="shrink-0 flex items-center">
          <img
            :src="albumData.coverImage"
            :alt="albumData.title"
            class="w-44 h-44 sm:w-56 sm:h-56 md:w-60 md:h-60 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96 object-cover rounded-md shadow-2xl"
          />
        </div>

        <!-- Album Info -->
        <div class="flex-1 flex items-stretch w-full">
          <div
            class="backdrop-blur-[4.45px] rounded-lg p-3 sm:p-4 md:p-6 flex flex-col justify-between w-full"
            style="opacity: 0.94; background-color: rgba(198, 175, 175, 0.3)"
          >
            <div>
              <!-- Title -->
              <h1 class="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 text-gray-900 leading-snug wrap-break-word text-center md:text-left">
                {{ albumData.title }}
              </h1>

              <!-- Artists -->
              <div class="flex flex-wrap justify-center md:justify-start gap-2 text-sm text-gray-700 mb-4 md:mb-5">
                <NuxtLink
                  v-for="artist in albumData.artists"
                  :key="artist.id"
                  :to="`/artists/${artist.id}`"
                  class="inline-flex items-center gap-1 hover:underline hover:text-gray-900 transition-colors"
                >
                  <UserRound :size="13" class="text-gray-500" />
                  {{ artist.pivot?.display_name || artist.name }}
                </NuxtLink>
              </div>

              <!-- Meta info -->
              <div class="flex flex-col items-center md:items-start gap-y-1.5 text-sm text-gray-700">
                <!-- Type badge + Catalog on same line -->
                <div v-if="albumData.type || albumData.catalogNumber" class="flex items-center gap-2">
                  <span v-if="albumData.catalogNumber" class="flex items-center gap-1 font-mono text-xs text-gray-600">
                    <Hash :size="12" class="text-gray-400 shrink-0" />
                    {{ albumData.catalogNumber }}
                  </span>
                  <span
                    v-if="albumData.type"
                    class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-gray-800/10 text-gray-700"
                  >
                    {{ formatType(albumData.type) }}
                  </span>
                </div>
                <span v-if="albumData.releaseDate" class="flex items-center gap-1.5">
                  <Calendar :size="14" class="text-gray-500 shrink-0" />
                  {{ albumData.releaseDate }}
                </span>
                <!-- Disc + Tracks grouped on same line -->
                <div class="flex items-center gap-4">
                  <span v-if="albumData.discCount > 0" class="flex items-center gap-1.5">
                    <Disc3 :size="14" class="text-gray-500 shrink-0" />
                    {{ albumData.discCount }} {{ albumData.discCount === 1 ? 'Disc' : 'Discs' }}
                  </span>
                  <span v-if="albumData.trackCount > 0" class="flex items-center gap-1.5">
                    <Music :size="14" class="text-gray-500 shrink-0" />
                    {{ albumData.trackCount }} Tracks
                  </span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-5 md:mt-4 flex flex-col gap-1.5">
              <!-- Like: full row on large+, shares row with others below lg -->
              <div class="flex gap-1.5">
                <button
                  class="btn btn-xs flex-1 lg:flex-none gap-1.5 h-7 min-h-0"
                  :class="isFavorited
                    ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                    : 'btn-outline border-red-400 text-red-600 hover:bg-red-50'"
                  :disabled="isToggling"
                  @click="toggleLike"
                >
                  <Heart :size="13" :fill="isFavorited ? 'currentColor' : 'none'" />
                  {{ isFavorited ? 'Liked' : 'Like' }}
                </button>
                <!-- Buy it + Edit: inline with Like below lg -->
                <button class="btn btn-xs flex-1 lg:hidden h-7 min-h-0 bg-black hover:bg-gray-800 text-white border-0 gap-1.5">
                  <ShoppingCart :size="13" />
                  Buy it
                </button>
                <NuxtLink
                  v-if="workId"
                  :to="isAuthenticated ? `/contribute/work/${workId}` : `/auth/login?redirect=/contribute/work/${workId}`"
                  class="btn btn-xs flex-1 lg:hidden h-7 min-h-0 btn-outline border-gray-400 text-gray-700 hover:bg-gray-50 gap-1.5"
                >
                  <Edit :size="13" />
                  Edit
                </NuxtLink>
              </div>
              <!-- Buy it + Edit: own row on lg+ only -->
              <div class="hidden lg:flex gap-1.5">
                <button class="btn btn-xs flex-none h-7 min-h-0 gap-1.5 bg-black hover:bg-gray-800 text-white border-0">
                  <ShoppingCart :size="13" />
                  Buy it
                </button>
                <NuxtLink
                  v-if="workId"
                  :to="isAuthenticated ? `/contribute/work/${workId}` : `/auth/login?redirect=/contribute/work/${workId}`"
                  class="btn btn-xs flex-none h-7 min-h-0 btn-outline border-gray-400 text-gray-700 hover:bg-gray-50 gap-1.5"
                >
                  <Edit :size="13" />
                  Edit
                </NuxtLink>
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
  Heart,
  ShoppingCart,
  Calendar,
  Disc3,
  Music,
  Hash,
  Edit,
  UserRound,
} from "lucide-vue-next";

const formatType = (type) => {
  const map = {
    album: 'Album',
    single: 'Single',
    ep: 'EP',
    mini_album: 'Mini Album',
    compilation: 'Compilation',
    live: 'Live',
    soundtrack: 'Soundtrack',
    other: 'Other',
  };
  return map[type?.toLowerCase()] || type;
};


const { isAuthenticated } = useAuth()
const { $api } = useNuxtApp()
const route = useRoute()

const props = defineProps({
  albumData: {
    type: Object,
    required: true,
  },
  workId: {
    type: [String, Number],
    default: null,
  },
  initialFavorited: {
    type: Boolean,
    default: false,
  },
});

const isFavorited = ref(props.initialFavorited)
const isToggling = ref(false)

const toggleLike = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  if (!props.workId || isToggling.value) return

  isToggling.value = true
  try {
    const result = await $api(`/v1/favorites/works/${props.workId}`, {
      method: 'POST',
    })
    isFavorited.value = result.favorited
  } catch {
    // 401 已由 api 插件处理
  } finally {
    isToggling.value = false
  }
}
</script>
