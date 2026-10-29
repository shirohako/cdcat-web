<script setup lang="ts">
import type { TrackOriginal } from '~/types/album'

/** A track's 原曲: links to the ones in the catalog, the names of the others; inline with slashes, or one per line. */
defineProps<{ originals: TrackOriginal[], stack?: boolean }>()
</script>

<template>
  <span :class="stack && 'flex flex-col'">
    <template v-for="(original, index) in originals" :key="index">
      <NuxtLink v-if="original.track" :to="`/tracks/${original.track.id}`" class="text-title underline decoration-faint underline-offset-[3px] transition-colors hover:text-primary">{{ original.title }}</NuxtLink>
      <span v-else>{{ original.title }}</span>
      <span v-if="!stack && index < originals.length - 1" class="text-faint"> / </span>
    </template>
  </span>
</template>
