<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <!-- Header -->
      <div class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-4xl font-bold mb-2">Events</h1>
          <p class="text-gray-600">
            按系列归类的同人展会与音乐展
          </p>
        </div>
        <div class="flex items-center gap-4 text-sm text-gray-600">
          <div class="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Calendar class="text-blue-500" :size="18" />
            <span>总计 {{ totalEvents }} 个活动</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <MapPin class="text-rose-500" :size="18" />
            <span>{{ groups.length }} 个系列</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex items-center justify-center min-h-60">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex items-center justify-center min-h-60">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>加载失败: {{ error.message }}</span>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="space-y-8">
        <section
          v-for="group in groups"
          :key="group.slug"
          class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                {{ group.name }}
              </h2>
              <p class="text-gray-600">{{ groupDescription(group) }}</p>
            </div>
            <div class="flex gap-2">
              <span class="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {{ (group.events || []).length }} 届次
              </span>
              <a
                v-if="group.website"
                :href="group.website"
                target="_blank"
                rel="noopener"
                class="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200 hover:text-blue-600"
              >
                官方站点
              </a>
            </div>
          </div>

          <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <div
              v-for="event in visibleEvents(group)"
              :key="event.id || event.slug"
              class="rounded-xl border border-gray-100 bg-white/80 p-4 shadow-sm"
            >
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-lg font-semibold text-gray-900 truncate">
                  {{ event.slug || event.name }}
                </h3>
              </div>

              <div class="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Calendar :size="16" class="text-gray-400" />
                <span class="font-medium">{{ formatEventDate(event) }}</span>
              </div>
            </div>

            <div
              v-if="(group.events || []).length > DEFAULT_VISIBLE_EVENTS"
              class="col-span-full flex justify-center pt-2"
            >
              <button
                type="button"
                class="btn btn-outline btn-sm"
                @click="toggleSeries(group)"
              >
                {{ isSeriesExpanded(group) ? '收起' : `显示全部（+${hiddenEventsCount(group)}）` }}
              </button>
            </div>

            <div v-if="(group.events || []).length === 0" class="col-span-full">
              <div class="flex items-center justify-center rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 bg-gray-50">
                暂无具体届次
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Calendar, MapPin } from "lucide-vue-next";

const { data: groupResponse, pending, error } = await useAPI("/v1/events/series");

const groups = computed(() => {
  const raw = groupResponse.value;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data;
  return [];
});

const totalEvents = computed(() => {
  return groups.value.reduce((sum, group) => sum + (group.events || []).length, 0);
});

const DEFAULT_VISIBLE_EVENTS = 20;
const expandedSeries = ref({});

const seriesKey = (group) => group?.slug || String(group?.id || "");

const isSeriesExpanded = (group) => Boolean(expandedSeries.value[seriesKey(group)]);

const toggleSeries = (group) => {
  const key = seriesKey(group);
  expandedSeries.value[key] = !expandedSeries.value[key];
};

const visibleEvents = (group) => {
  const events = group?.events || [];
  if (events.length <= DEFAULT_VISIBLE_EVENTS) return events;
  if (isSeriesExpanded(group)) return events;
  return events.slice(0, DEFAULT_VISIBLE_EVENTS);
};

const hiddenEventsCount = (group) => {
  const events = group?.events || [];
  if (events.length <= DEFAULT_VISIBLE_EVENTS) return 0;
  if (isSeriesExpanded(group)) return 0;
  return events.length - DEFAULT_VISIBLE_EVENTS;
};

const groupDescription = (group) => {
  const desc = group.description;
  if (!desc) return "暂无介绍";
  if (typeof desc === "string") return desc;
  return desc["zh-Hans"] || desc["zh-CN"] || desc["en"] || "暂无介绍";
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatEventDate = (event) => {
  const start = event?.start_date ? formatDate(event.start_date) : "";
  const end = event?.end_date ? formatDate(event.end_date) : "";
  if (start && end && start !== end) return `${start} ~ ${end}`;
  return start || end || "";
};

useHead({
  title: "Events | CDCAT",
  meta: [
    {
      name: "description",
      content: "归档的同人展活动列表"
    }
  ]
});
</script>
