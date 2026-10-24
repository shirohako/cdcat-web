<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.description')" :icon="FileText" class="px-6 pb-2 pt-5" />

    <!-- Content -->
    <div class="px-6 pb-5 pt-2 text-body">
      <RichContent :content="description" format="markdown" />
    </div>
  </section>
</template>

<script setup>
import { FileText } from "@lucide/vue";

defineProps({
  description: {
    type: String,
    default: "",
  },
});
</script>
