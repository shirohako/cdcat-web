<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <ListMusic :size="24" />
        Tracklist
      </h2>
      <label class="flex items-center gap-2 cursor-pointer">
        <span class="text-sm text-gray-600 flex items-center gap-1.5">
          <Users :size="16" />
          人员信息
        </span>
        <button
          type="button"
          @click="showCredits = !showCredits"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :class="showCredits ? 'bg-blue-600' : 'bg-gray-300'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="showCredits ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </label>
    </div>

    <div v-if="discs.length" class="space-y-10">
      <div v-for="disc in discs" :key="disc.discNumber">
        <div class="bg-gray-100 px-4 py-3 mb-4 rounded-md flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Disc3 :size="20" class="text-gray-700" />
            <h3 class="text-lg font-bold text-gray-900">
              Disc {{ disc.discNumber }}
            </h3>
            <span v-if="disc.title" class="text-base font-medium text-gray-700">
              — {{ disc.title }}
            </span>
          </div>
          <span class="text-sm text-gray-500">
            {{ disc.tracks.length }} tracks
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="track in disc.tracks"
            :key="track.uid"
            class="flex items-center gap-2 p-3 hover:bg-gray-50 rounded transition"
          >
            <span class="text-gray-500 font-mono text-sm w-8 text-center">{{
              track.displayNumber
            }}</span>
            <button
              v-if="isAuthenticated && track.songId"
              type="button"
              :disabled="!!toggleLoading[track.songId]"
              @click="handleToggleFavorite(track.songId)"
              class="p-1 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              :title="favoritedSongs[track.songId] ? '取消收藏' : '收藏'"
            >
              <Heart
                :size="16"
                :fill="favoritedSongs[track.songId] ? 'currentColor' : 'none'"
                :class="favoritedSongs[track.songId] ? 'text-red-500' : 'text-gray-400'"
              />
            </button>
            <div class="flex-1">
              <p class="font-medium">{{ track.title }}</p>
              <p v-if="track.subtitle" class="text-sm text-gray-500 mt-0.5">
                {{ track.subtitle }}
              </p>
              <p v-if="showCredits && track.artist" class="text-sm text-gray-500">
                {{ track.artist }}
              </p>
              <div
                v-if="showCredits && track.credits && track.credits.length"
                class="mt-1 space-y-0.5"
              >
                <p v-for="(credit, idx) in track.credits" :key="idx" class="text-xs text-gray-400">
                  <span class="font-medium">{{ credit.role }}:</span>
                  <template v-for="(artist, artistIdx) in credit.artists" :key="artistIdx">
                    <NuxtLink
                      v-if="artist.artistId"
                      :to="`/artists/${artist.artistId}`"
                      class="hover:underline hover:text-gray-500 transition-colors"
                    >
                      {{ artist.name }}
                    </NuxtLink>
                    <span v-else>{{ artist.name }}</span>
                    <span v-if="artistIdx < credit.artists.length - 1">, </span>
                  </template>
                </p>
              </div>
            </div>
            <span class="text-gray-500 text-sm">{{ track.duration }}</span>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-gray-500">暂无曲目信息。</p>
  </section>
</template>

<script setup>
import { ListMusic, Disc3, Users, Heart } from "lucide-vue-next";

const { isAuthenticated } = useAuth();
const { toggleFavoriteSong } = useFavorites();
const route = useRoute();

const showCredits = ref(true);
const favoritedSongs = ref({});
const toggleLoading = ref({});

const handleToggleFavorite = async (songId) => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }
  if (toggleLoading.value[songId]) return;

  toggleLoading.value = { ...toggleLoading.value, [songId]: true };
  try {
    const result = await toggleFavoriteSong(songId);
    favoritedSongs.value = { ...favoritedSongs.value, [songId]: result.favorited };
  } catch {
    // 401 已由 api 插件处理
  } finally {
    const { [songId]: _, ...rest } = toggleLoading.value;
    toggleLoading.value = rest;
  }
};

const props = defineProps({
  songs: {
    type: Array,
    default: () => [],
  },
  structure: {
    type: Array,
    default: () => [],
  },
});

const normalizeNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDuration = value => {
  const seconds = normalizeNumber(value);
  if (seconds === null || seconds < 0) {
    return "--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const trackSortValue = song =>
  normalizeNumber(song.track_number) ?? Number.MAX_SAFE_INTEGER;

const processTracks = (list, discNumber) => {
  return list
    .slice()
    .sort((a, b) => trackSortValue(a) - trackSortValue(b))
    .map(song => {
      const trackNumber = normalizeNumber(song.track_number);
      const artistNames = Array.isArray(song.artists)
        ? song.artists
            .map(artist => artist?.name)
            .filter(Boolean)
            .join(", ")
        : song.artist_names || song.artist || song.artist_name || "";

      // 处理歌曲 Credit
      const credits = song.credits || [];
      const formattedCredits = [];
      if (credits.length > 0) {
        const groups = new Map();
        credits.forEach((c) => {
          const role = c.role ? c.role.charAt(0).toUpperCase() + c.role.slice(1) : "Credit";
          // 优先级：外层 display_name -> artist.name -> pivot.display_name
          const name = c.display_name || c.artist?.name || c.artist?.pivot?.display_name || c.name;
          const artistId = c.artist_id || c.artist?.id;
          if (name) {
            if (!groups.has(role)) groups.set(role, []);
            // 检查是否已存在相同的 artist
            const existing = groups.get(role).find(item => item.name === name);
            if (!existing) {
              groups.get(role).push({ name, artistId });
            }
          }
        });
        for (const [role, artists] of groups) {
          formattedCredits.push({ role, artists });
        }
      }

      return {
        songId: song.id ?? null,
        uid:
          song.id ??
          `disc-${discNumber}-${trackNumber ?? song.title ?? "track"}`,
        displayNumber:
          trackNumber !== null
            ? trackNumber.toString().padStart(2, "0")
            : "--",
        title: song.title || "Untitled Track",
        subtitle: song.meta?.subtitle || null,
        credits: formattedCredits,
        artist: artistNames,
        duration: formatDuration(song.duration),
      };
    });
};

const discs = computed(() => {
  if (Array.isArray(props.structure) && props.structure.length > 0) {
    return props.structure.map(disc => {
      const discNumber = disc.disc_number;
      const songs = Array.isArray(disc.songs)
        ? disc.songs
        : props.songs.filter(
            s => (normalizeNumber(s.disc_number) ?? 1) === discNumber
          );
      return {
        discNumber,
        title: disc.name || disc.title,
        tracks: processTracks(songs, discNumber),
      };
    });
  }

  if (!Array.isArray(props.songs) || props.songs.length === 0) {
    return [];
  }

  const discMap = new Map();
  props.songs.forEach(song => {
    const discNumber = normalizeNumber(song.disc_number) ?? 1;
    if (!discMap.has(discNumber)) {
      discMap.set(discNumber, []);
    }
    discMap.get(discNumber).push(song);
  });

  return Array.from(discMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([discNumber, discSongs]) => {
      return {
        discNumber,
        title: null,
        tracks: processTracks(discSongs, discNumber),
      };
    });
});
</script>
