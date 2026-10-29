<script setup lang="ts">
import type { TracklistPerson } from '~/utils/tracklistView'

/** The people of one credit: names (with the artist hover card while it is on) and detail notes, inline or one per line. */
defineProps<{ people: TracklistPerson[], stack?: boolean }>()

const { prefs } = useTracklist()
</script>

<template>
  <span :class="stack && 'flex flex-col'">
    <span v-for="(person, index) in people" :key="index">
      <CatalogArtistName :name="person.name" :artist-id="person.artistId" :card="prefs.artistCard" />
      <span v-if="person.detail" class="text-meta"> ({{ person.detail }})</span>
      <span v-if="!stack && index < people.length - 1">, </span>
    </span>
  </span>
</template>
