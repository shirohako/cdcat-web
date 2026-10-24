<template>
  <div class="card p-5 text-center">
    <NuxtLink :to="`/profile/${author.username}`" class="group">
      <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mx-auto mb-3
                  ring-4 ring-primary/15 group-hover:ring-primary/40 transition-shadow duration-150 ease-out">
        <img v-if="author.avatar_url" :src="author.avatar_url" :alt="author.nickname" class="w-full h-full object-cover" />
        <UserRound v-else :size="28" class="text-primary" />
      </div>
      <p class="font-semibold text-title group-hover:text-primary transition-colors duration-150 ease-out text-sm">
        {{ author.nickname || author.username }}
      </p>
      <p class="text-xs text-meta mt-0.5">@{{ author.username }}</p>
    </NuxtLink>
  </div>
</template>

<script setup>
import { UserRound } from "@lucide/vue";

defineProps({
  author: { type: Object, required: true },
});
</script>
