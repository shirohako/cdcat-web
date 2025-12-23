<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <ListMusic :size="24" />
      Tracklist
    </h2>

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
              <div
                v-if="track.credits && track.credits.length"
                class="mt-1 space-y-0.5"
              >
                <p v-for="(credit, idx) in track.credits" :key="idx" class="text-xs text-gray-400">
                  {{ credit }}
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
import { ListMusic, Disc3 } from "lucide-vue-next";

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
          const name = c.artist_name || c.artist?.name || c.name;
          if (name) {
            if (!groups.has(role)) groups.set(role, []);
            groups.get(role).push(name);
          }
        });
        for (const [role, names] of groups) formattedCredits.push(`${role}: ${names.join(", ")}`);
      }

      return {
        uid:
          song.id ??
          `disc-${discNumber}-${trackNumber ?? song.title ?? "track"}`,
        displayNumber:
          trackNumber !== null
            ? trackNumber.toString().padStart(2, "0")
            : "--",
        title: song.title || "Untitled Track",
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
