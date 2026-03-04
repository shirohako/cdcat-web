<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
      <Link2 :size="20" />
      External Links
    </h3>

    <div v-if="links && links.length > 0" class="space-y-1.5">
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition group"
      >
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span class="text-xs font-semibold text-gray-600">
              {{ getProviderInitial(link.provider.name) }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-900 capitalize">
              {{ formatProviderName(link.provider.name) }}
            </p>
          </div>
        </div>
        <ExternalLink :size="14" class="text-gray-400 group-hover:text-gray-600 shrink-0" />
      </a>
    </div>

    <p v-else class="text-gray-500 text-sm">No links available.</p>
  </section>
</template>

<script setup>
import { Link2, ExternalLink } from "lucide-vue-next";

const props = defineProps({
  links: {
    type: Array,
    default: () => [],
  },
});

const formatProviderName = (name) => {
  return name.replace(/_/g, ' ');
};

const getProviderInitial = (name) => {
  const formatted = formatProviderName(name);
  return formatted.charAt(0).toUpperCase();
};
</script>