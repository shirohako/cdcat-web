<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <Users :size="24" />
      Credits
    </h2>
    
    <div v-if="credits && credits.length" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <div v-for="(item, index) in credits" :key="index" class="flex flex-col">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          {{ item.role }}
        </span>
        <span class="text-sm font-medium text-gray-900 leading-relaxed">
          {{ item.names }}
        </span>
      </div>
    </div>
    <p v-else class="text-sm text-gray-500">暂无制作人员信息。</p>
  </section>
</template>

<script setup>
import { Users } from "lucide-vue-next";

defineProps({
  credits: {
    type: Array,
    default: () => []
  }
});
</script>