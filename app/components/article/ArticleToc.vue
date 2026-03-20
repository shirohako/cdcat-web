<template>
  <div v-if="tocItems.length > 0" class="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-6">
    <div class="flex items-center gap-2 px-4 py-3 bg-linear-to-r from-violet-500 to-indigo-500">
      <List :size="14" class="text-white/90" />
      <span class="text-sm font-semibold text-white">目录</span>
    </div>

    <nav class="px-3 py-3 max-h-[60vh] overflow-y-auto toc-scroll">
      <ul class="space-y-0.5">
        <li
          v-for="item in tocItems"
          :key="item.id"
          :style="{ paddingLeft: `${(item.level - minLevel) * 12}px` }"
        >
          <a
            :href="`#${item.id}`"
            class="block text-xs py-1 px-2 rounded-lg truncate transition-all duration-200 leading-snug"
            :class="activeId === item.id
              ? 'text-violet-600 font-semibold bg-violet-50'
              : 'text-gray-500 hover:text-violet-500 hover:bg-gray-50'"
            @click.prevent="scrollTo(item.id)"
          >
            {{ item.text }}
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { List } from "lucide-vue-next";

const props = defineProps({
  tocItems: { type: Array, default: () => [] },
  articleEl: { type: Object, default: null },
});

const minLevel = computed(() => {
  if (props.tocItems.length === 0) return 1;
  return Math.min(...props.tocItems.map(i => i.level));
});

const activeId = ref('');

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
};

let observer = null;

const setupObserver = () => {
  observer?.disconnect();
  if (!props.articleEl) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id;
          break;
        }
      }
    },
    { rootMargin: '-60px 0px -70% 0px', threshold: 0 }
  );

  const headings = props.articleEl.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
  headings.forEach(h => observer.observe(h));
};

watch(() => props.articleEl, setupObserver);
onMounted(setupObserver);
onUnmounted(() => observer?.disconnect());
</script>

<style scoped>
.toc-scroll::-webkit-scrollbar { width: 3px; }
.toc-scroll::-webkit-scrollbar-track { background: transparent; }
.toc-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
</style>
