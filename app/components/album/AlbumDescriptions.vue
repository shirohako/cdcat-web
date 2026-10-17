<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
        <FileText :size="16" class="text-sky-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('album.section.description') }}</h2>
    </div>

    <!-- Content -->
    <div class="px-6 py-5 text-gray-700">
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
