<template>
  <div class="min-h-screen relative overflow-hidden">
    <div
      class="relative z-10 container mx-auto max-w-6xl 2xl:max-w-7xl px-4 md:px-8 py-16 md:py-24 space-y-16"
    >
      <!-- Hero -->
      <section class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div class="space-y-6">
          <div class="space-y-4 animate-rise">
            <div class="flex items-center gap-4">
              <!-- The name follows, so the picture needs no alt text of its own. -->
              <img
                src="/icon.png"
                alt=""
                width="80"
                height="80"
                class="size-16 md:size-20 rounded-2xl ring-4 ring-card"
              >
              <p class="text-3xl md:text-4xl font-black tracking-tight text-title">CDCAT</p>
            </div>
            <h1
              class="text-3xl md:text-4xl font-black leading-tight tracking-tight text-title"
            >
              {{ t('home.hero_title') }}
            </h1>
            <p class="text-lg text-body max-w-2xl">
              {{ t('home.hero_description') }}
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 animate-rise-delayed">
            <NuxtLink
              to="/albums"
              class="btn btn-primary group min-h-12 px-6 text-base"
            >
              <Music :size="20" />
              {{ t('home.browse_albums') }}
              <ArrowRight
                :size="18"
                class="transition-transform duration-150 ease-out group-hover:translate-x-1"
              />
            </NuxtLink>
            <NuxtLink
              to="/artists"
              class="btn min-h-12 px-6 text-base"
            >
              <Users :size="20" />
              {{ t('home.discover_artists') }}
            </NuxtLink>
          </div>

          <div
            class="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-rise-slower"
          >
            <div class="card py-3.5 px-4">
              <div
                class="flex items-center gap-2 font-semibold text-title"
              >
                <Disc3 :size="18" class="text-primary" />
                <span>{{ t('home.database') }}</span>
              </div>
              <p class="text-sm text-body mt-1">{{ t('home.database_desc') }}</p>
            </div>
            <div class="card py-3.5 px-4">
              <div class="flex items-center gap-2 font-semibold text-title">
                <Search :size="18" class="text-primary" />
                <span>{{ t('home.timeline') }}</span>
              </div>
              <p class="text-sm text-body mt-1">
                {{ t('home.timeline_desc') }}
              </p>
            </div>
            <div class="card py-3.5 px-4">
              <div class="flex items-center gap-2 font-semibold text-title">
                <Radio :size="18" class="text-primary" />
                <span>{{ t('home.community') }}</span>
              </div>
              <p class="text-sm text-body mt-1">
                {{ t('home.community_desc') }}
              </p>
            </div>
          </div>
        </div>

        <div class="relative">
          <div class="card p-5 animate-rise-quick">
            <div class="flex items-center">
              <div
                class="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-3 py-1 text-xs font-semibold"
              >
                <Sparkles :size="14" />
                <span>{{ t('home.beta') }}</span>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <div
                class="rounded-xl bg-sunken p-4"
              >
                <p class="mb-3 text-sm font-semibold text-body">
                  {{ t('home.search_question') }}
                </p>
                <form
                  role="search"
                  class="rounded-lg border border-line bg-field px-4 py-3 flex items-center gap-3 transition duration-150 ease-out focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20"
                  @submit.prevent="submitSearch"
                >
                  <Search :size="18" class="shrink-0 text-meta" />
                  <input
                    v-model="searchText"
                    type="search"
                    maxlength="100"
                    :placeholder="t('home.search_example')"
                    :aria-label="t('search.title')"
                    class="min-w-0 flex-1 bg-transparent text-sm text-title placeholder:text-faint focus:outline-none"
                  >
                </form>
              </div>

              <p class="text-sm font-semibold text-body">{{ t('home.discover_more') }}</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-sunken p-3.5">
                  <div
                    class="flex items-center gap-2 font-semibold text-title"
                  >
                    <Library :size="16" class="text-primary" />
                    <span>{{ t('home.find_music') }}</span>
                  </div>
                </div>
                <div class="rounded-xl bg-sunken p-3.5">
                  <div
                    class="flex items-center gap-2 font-semibold text-title"
                  >
                    <Mic2 :size="16" class="text-primary" />
                    <span>{{ t('home.find_artists') }}</span>
                  </div>
                </div>
                <div class="rounded-xl bg-sunken p-3.5">
                  <div
                    class="flex items-center gap-2 font-semibold text-title"
                  >
                    <CalendarDays :size="16" class="text-primary" />
                    <span>{{ t('home.gear_reviews') }}</span>
                  </div>
                </div>
                <div class="rounded-xl bg-sunken p-3.5">
                  <div
                    class="flex items-center gap-2 font-semibold text-title"
                  >
                    <Tag :size="16" class="text-primary" />
                    <span>{{ t('home.discussions') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Portal -->
      <section class="space-y-6">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h2 class="text-3xl font-bold text-title">{{ t('home.for_everyone') }}</h2>
            <p class="text-body mt-1">
              {{ t('home.for_everyone_desc') }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="link in portalLinks"
            :key="link.title"
            class="card group flex items-start gap-4 p-5"
          >
            <div
              class="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/15 text-primary"
            >
              <component :is="link.icon" :size="22" />
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-semibold text-title">
                  {{ link.title }}
                </h3>
                <ArrowRight
                  :size="16"
                  class="text-meta transition-transform duration-150 ease-out group-hover:translate-x-1"
                />
              </div>
              <p class="text-body">{{ link.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- What We Offer -->
      <section
        class="card p-6 md:p-10 space-y-10"
      >
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {{ t('home.offer_label') }}
            </p>
            <h2 class="text-3xl font-bold text-title">{{ t('home.clean_data') }}</h2>
            <p class="text-body mt-1">
              {{ t('home.clean_data_desc') }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 text-xs text-body">
            <span class="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-btn text-btn-content font-semibold">{{ t('home.editable') }}</span>
            <span class="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-btn text-btn-content font-semibold">{{ t('home.open_api') }}</span>
            <span class="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-btn text-btn-content font-semibold">{{ t('home.free') }}</span>
          </div>
        </div>

        <div class="grid md:grid-cols-4 gap-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="rounded-xl bg-sunken p-4 text-center"
          >
            <div class="text-3xl font-black text-title">
              {{ stat.value }}
            </div>
            <div class="text-sm font-semibold text-body mt-1">
              {{ stat.label }}
            </div>
            <p class="text-xs text-meta mt-1">{{ stat.desc }}</p>
          </div>
        </div>
      </section>

      <!-- Featured Topics -->
      <section class="space-y-6">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {{ t('home.topics_label') }}
            </p>
            <h2 class="text-3xl font-bold text-title">{{ t('home.beyond_music') }}</h2>
            <p class="text-body mt-1">
              {{ t('home.beyond_music_desc') }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="topic in topics"
            :key="topic.title"
            class="card p-4.5"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="h-11 w-11 rounded-full flex items-center justify-center bg-primary/15 text-primary"
                >
                  <component :is="topic.icon" :size="20" />
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-meta">
                    {{ topic.tag }}
                  </p>
                  <h3 class="text-lg font-semibold text-title">
                    {{ topic.title }}
                  </h3>
                </div>
              </div>
            </div>
            <p class="text-body mt-3">{{ topic.desc }}</p>
            <div class="flex flex-wrap gap-2 mt-4">
              <span
                v-for="pill in topic.pills"
                :key="pill"
                class="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-btn text-btn-content font-semibold"
              >
                {{ pill }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Flow -->
      <section
        class="card p-8 md:p-12 overflow-hidden relative"
      >
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute inset-0 opacity-30 hero-grid" />
        </div>
        <div class="relative z-10 space-y-8">
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Flow
              </p>
              <h2 class="text-3xl font-bold text-title">{{ t('home.collector_title') }}</h2>
              <p class="text-body mt-2">
                {{ t('home.collector_desc') }}
              </p>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <div
              v-for="(item, index) in flow"
              :key="item.title"
              class="rounded-xl bg-sunken p-5"
            >
              <div class="flex items-center gap-3">
                <div
                  class="h-10 w-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold"
                >
                  {{ index + 1 }}
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-meta">
                    {{ item.tag }}
                  </p>
                  <h3 class="text-lg font-semibold text-title">{{ item.title }}</h3>
                </div>
              </div>
              <p class="text-body mt-3 leading-relaxed">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import {
  ArrowRight,
  CalendarDays,
  Disc3,
  Library,
  Mic2,
  Music,
  Radio,
  Search,
  Sparkles,
  Tag,
  Users,
  ListMusic,
  Globe2,
} from "@lucide/vue";

const { t } = useI18n();

const searchText = ref('');
const submitSearch = () => {
  const text = searchText.value.trim();
  if (text) navigateTo({ path: '/search', query: { q: text } });
};

const portalLinks = computed(() => [
  {
    title: t('home.listener'),
    desc: t('home.listener_desc'),
    icon: Library,
  },
  {
    title: t('home.creator'),
    desc: t('home.creator_desc'),
    icon: Mic2,
  },
]);

const stats = computed(() => [
  { value: "0K+", label: t('home.stats.albums'), desc: "" },
  { value: "0K+", label: t('home.stats.artists'), desc: "" },
  { value: "0K+", label: t('home.stats.tracks'), desc: "" },
  { value: "0K+", label: t('home.stats.reviews'), desc: "" },
]);

const topics = computed(() => [
  {
    tag: t('home.topic_entry_tag'),
    title: t('home.topic_entry_title'),
    desc: t('home.topic_entry_desc'),
    pills: [t('home.anime'), t('home.games'), t('home.tv')],
    icon: Globe2,
  },
  {
    tag: t('home.topic_series_tag'),
    title: t('home.topic_series_title'),
    desc: t('home.topic_series_desc'),
    pills: [t('home.combined_entries'), t('home.shared_theme')],
    icon: ListMusic,
  },
]);

const flow = computed(() => [
  {
    tag: "Products",
    title: t('home.products'),
    desc: t('home.products_desc'),
    icon: Search,
  },
  {
    tag: "Tokuten",
    title: t('home.bonuses'),
    desc: t('home.bonuses_desc'),
    icon: Library,
  },
  {
    tag: "Links",
    title: t('home.links'),
    desc: t('home.links_desc'),
    icon: Tag,
  },
]);

const absolute = useSiteUrl();
usePageSeo({
  title: () => t('home.seo_title'),
  description: () => t('home.seo_description'),
  jsonLd: () => websiteLd({ name: SITE_NAME, url: absolute('/'), logo: absolute('/icon.png'), description: t('home.seo_description') }),
});
useHead({
  // The home title already names the site.
  titleTemplate: '%s',
  meta: [{ name: 'keywords', content: computed(() => t('home.seo_keywords')) }],
});
</script>

<style scoped>
/* A faint grid behind the Flow card, in the line colour so it shows in both themes. */
.hero-grid {
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 32px 32px;
  /* One grid step per loop, so the drift never jumps. */
  animation: shimmer 4s linear infinite;
}

/* The keyframes are scoped, so animations that use them must be declared here too: Tailwind's
   `animate-[fade-in…]` would point at the unscoped name and never run.
   `backwards`, not `both`: hidden during the delay, and no transform left behind afterwards. */
.animate-rise-quick {
  animation: fade-in 0.6s ease backwards;
}

.animate-rise {
  animation: fade-in 0.7s ease backwards;
}

.animate-rise-delayed {
  animation: fade-in 0.8s ease backwards;
  animation-delay: 0.05s;
}

.animate-rise-slower {
  animation: fade-in 0.9s ease backwards;
  animation-delay: 0.1s;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position:
      0 0,
      0 0;
  }
  100% {
    background-position:
      32px 32px,
      32px 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-grid,
  .animate-rise-quick,
  .animate-rise,
  .animate-rise-delayed,
  .animate-rise-slower {
    animation: none;
  }
}
</style>
