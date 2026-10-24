<script setup lang="ts">
import type { Component } from 'vue'
// Imported by name: this file is also called Icon, and <Icon> would otherwise mean itself.
import { Icon } from '#components'

/** An icon given either as a Nuxt Icon name ('lucide:x') or as an @lucide/vue component; both are used in the app. */
defineProps<{ icon: string | Component }>()
</script>

<template>
  <Icon v-if="typeof icon === 'string'" :name="icon" />
  <component :is="icon" v-else />
</template>
