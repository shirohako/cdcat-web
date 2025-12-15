<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <ListMusic :size="24" />
      Tracklist
    </h2>

    <div v-if="discs.length" class="space-y-6">
      <div v-for="disc in discs" :key="disc.discNumber" class="space-y-3">
        <div
          class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          <div class="flex items-center gap-2 text-gray-600">
            <Disc3 :size="16" />
            <span>Disc {{ disc.discNumber }}</span>
          </div>
          <span>{{ disc.tracks.length }} Tracks</span>
        </div>

        <div class="space-y-2">
          <div
            v-for="track in disc.tracks"
            :key="track.uid"
            class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded transition"
          >
            <span class="text-gray-500 font-mono text-sm w-8">{{
              track.displayNumber
            }}</span>
            <div class="flex-1">
              <p class="font-medium">{{ track.title }}</p>
              <p v-if="track.artist" class="text-sm text-gray-500">
                {{ track.artist }}
              </p>
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
import { ListMusic, Disc3 } from "lucide-vue-next";

const props = defineProps({
  songs: {
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

const discs = computed(() => {
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
      const tracks = discSongs
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

          return {
            uid:
              song.id ??
              `disc-${discNumber}-${trackNumber ?? song.title ?? "track"}`,
            displayNumber:
              trackNumber !== null
                ? trackNumber.toString().padStart(2, "0")
                : "--",
            title: song.title || "Untitled Track",
            artist: artistNames,
            duration: formatDuration(song.duration),
          };
        });

      return {
        discNumber,
        tracks,
      };
    });
});
</script>
