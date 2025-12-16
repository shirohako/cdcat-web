<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
      <!-- Header -->
      <div class="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Events</h1>
          <p class="text-gray-500 text-lg">
            按系列归类的同人展会与音乐展
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
          <div class="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <Calendar class="text-blue-500" :size="16" />
            <span>{{ totalEvents }} 个活动</span>
          </div>
          <div class="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <MapPin class="text-rose-500" :size="16" />
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
      <div v-else class="space-y-10">
        <section
          v-for="group in groups"
          :key="group.slug"
          class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 transition-all duration-200"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
            <div class="space-y-2">
              <h2 class="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                {{ group.name }}
              </h2>
              <p class="text-gray-500 text-sm leading-relaxed max-w-2xl">{{ groupDescription(group) }}</p>
            </div>
            <div class="shrink-0 pt-1">
              <a
                v-if="group.website"
                :href="group.website"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                官方站点
                <ExternalLink :size="14" />
              </a>
            </div>
          </div>

          <div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="event in visibleEvents(group)"
              :key="event.id || event.slug"
              class="group/card relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div class="flex items-center gap-2 mb-3">
                  <span class="px-2.5 py-1 text-xs font-bold tracking-wide text-gray-500 uppercase bg-gray-100 rounded-md group-hover/card:bg-blue-50 group-hover/card:text-blue-600 transition-colors">
                    {{ event.slug }}
                  </span>
                </div>
                <h3 class="text-lg font-bold text-gray-900 leading-snug mb-4 group-hover/card:text-blue-600 transition-colors">
                  {{ event.name || event.slug }}
                </h3>
              </div>

              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar :size="15" class="text-gray-400 shrink-0" />
                  <span class="font-medium truncate">{{ formatEventDate(event) }}</span>
                </div>
                <div v-if="event.location" class="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin :size="15" class="text-gray-400 shrink-0" />
                  <span class="truncate" :title="event.location">{{ event.location }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="(group.events || []).length > DEFAULT_VISIBLE_EVENTS"
              class="col-span-full flex justify-center pt-2"
            >
              <button
                type="button"
                class="flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                @click="toggleSeries(group)"
              >
                <span>{{ isSeriesExpanded(group) ? '收起' : `显示全部 (${hiddenEventsCount(group)} 个更多)` }}</span>
                <component :is="isSeriesExpanded(group) ? ChevronUp : ChevronDown" :size="16" />
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
import { Calendar, MapPin, ExternalLink, ChevronDown, ChevronUp } from "lucide-vue-next";

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
