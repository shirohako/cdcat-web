<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <!-- Decorative background -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-linear-to-br from-violet-200/50 to-indigo-200/20 blur-3xl" />
      <div class="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-linear-to-br from-sky-200/55 to-blue-200/20 blur-3xl" />
      <div class="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-linear-to-br from-amber-200/35 to-rose-200/15 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
    </div>

    <div class="relative container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/discussions"
            class="flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm text-gray-500 hover:text-gray-900 hover:ring-black/10 transition-all"
          >
            <Icon name="lucide:arrow-left" class="w-4 h-4" />
          </NuxtLink>
          <div>
            <p class="text-xs font-medium text-gray-500 tracking-wide uppercase">
              {{ lang.toUpperCase() }}
            </p>
            <h1 class="mt-1 text-2xl font-bold text-gray-900 tracking-tight">
              {{ currentSection?.label }}
            </h1>
          </div>
        </div>

        <button class="btn btn-sm btn-primary gap-1.5">
          <Icon name="lucide:plus" class="w-4 h-4" />
          {{ $t('discussion.new_topic') }}
        </button>
      </div>

      <!-- Topic List -->
      <div class="rounded-2xl ring-1 ring-black/5 overflow-hidden">
        <div class="bg-white/70 backdrop-blur-xl">
          <!-- Toolbar -->
          <div class="px-5 py-4 border-b border-gray-100/80">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2 rounded-xl bg-gray-100/70 p-1 ring-1 ring-black/5">
                <button
                  v-for="tab in tabs"
                  :key="tab.value"
                  type="button"
                  class="text-sm px-3 py-1.5 rounded-lg transition-all"
                  :class="activeTab === tab.value
                    ? 'bg-white text-gray-900 font-medium shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'"
                  @click="activeTab = tab.value"
                >
                  {{ tab.label }}
                </button>
              </div>

              <div class="flex items-center gap-2">
                <label class="relative flex-1 sm:w-64">
                  <span class="sr-only">Search</span>
                  <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    v-model="query"
                    type="search"
                    class="input input-bordered input-sm w-full pl-9 bg-white/80"
                    :placeholder="t('discussion.search_placeholder')"
                  >
                </label>
                <span class="hidden sm:inline-flex text-xs font-medium text-gray-400 bg-white/70 px-2.5 py-1 rounded-full ring-1 ring-black/5 tabular-nums">
                  {{ filteredTopics.length }}
                </span>
              </div>
            </div>
          </div>

          <!-- Topics -->
          <div class="divide-y divide-gray-100/80">
            <div
              v-for="topic in filteredTopics"
              :key="topic.id"
              class="group flex items-start gap-3.5 px-5 py-4 hover:bg-white/60 transition-colors cursor-pointer"
            >
              <!-- Avatar -->
              <div class="shrink-0 w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium mt-0.5 shadow-sm ring-1 ring-black/5">
                {{ topic.author.charAt(0) }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    v-if="topic.pinned"
                    class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 ring-1 ring-red-100"
                  >
                    {{ $t('discussion.pinned') }}
                  </span>
                  <span
                    v-if="topic.tag"
                    class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-600 ring-1 ring-gray-100"
                  >
                    {{ topic.tag }}
                  </span>
                  <h3 class="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                    {{ topic.title }}
                  </h3>
                </div>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                  <span class="text-gray-500">{{ topic.author }}</span>
                  <span>&middot;</span>
                  <span>{{ topic.lastReplyTime }}</span>
                  <template v-if="topic.lastReplyAuthor">
                    <span>&middot;</span>
                    <span>
                      {{ $t('discussion.last_reply_by') }}
                      <span class="text-gray-500">{{ topic.lastReplyAuthor }}</span>
                    </span>
                  </template>
                </div>
              </div>

              <!-- Reply Count -->
              <div
                v-if="topic.replies > 0"
                class="shrink-0 flex items-center justify-center min-w-9 h-7 px-2 rounded-full text-xs font-semibold mt-1 tabular-nums ring-1 ring-black/5 bg-white/70"
                :class="topic.replies >= 10 ? 'text-orange-600' : 'text-gray-500'"
              >
                {{ topic.replies }}
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredTopics.length === 0" class="py-20 text-center">
            <Icon name="lucide:message-circle" class="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p class="text-sm text-gray-500">{{ $t('discussion.empty') }}</p>
            <p v-if="query" class="mt-2 text-xs text-gray-400">
              {{ $t('discussion.search_no_results') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const lang = computed(() => route.params.lang as string)

const validLangs = ['ja', 'en', 'ko', 'zh', 'other']

const sectionMap = computed(() => ({
  ja: { label: t('discussion.lang.ja') },
  en: { label: t('discussion.lang.en') },
  ko: { label: t('discussion.lang.ko') },
  zh: { label: t('discussion.lang.zh') },
  other: { label: t('discussion.lang.other') }
}))

const currentSection = computed(() => sectionMap.value[lang.value as keyof typeof sectionMap.value])

if (!validLangs.includes(lang.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

useHead({
  title: `${currentSection.value?.label} - Discussion | CDCAT`
})

const activeTab = ref('latest')
const query = ref('')

const tabs = computed(() => [
  { value: 'latest', label: t('discussion.tab.latest') },
  { value: 'hot', label: t('discussion.tab.hot') },
  { value: 'unanswered', label: t('discussion.tab.unanswered') }
])

// Mock data - will be replaced with API calls
const mockTopics = [
  {
    id: 1,
    title: 'Welcome to the discussion board!',
    author: 'Admin',
    tag: 'Announcement',
    replies: 12,
    lastReplyTime: '2h ago',
    lastReplyAuthor: 'Alice',
    pinned: true
  },
  {
    id: 2,
    title: 'What are you listening to this week?',
    author: 'MusicFan',
    tag: 'General',
    replies: 34,
    lastReplyTime: '15m ago',
    lastReplyAuthor: 'Bob',
    pinned: false
  },
  {
    id: 3,
    title: 'Best releases of 2025 - share your picks',
    author: 'Collector',
    tag: 'General',
    replies: 8,
    lastReplyTime: '1h ago',
    lastReplyAuthor: 'Charlie',
    pinned: false
  },
  {
    id: 4,
    title: 'Looking for recommendations similar to this album',
    author: 'NewUser',
    tag: 'Recommendation',
    replies: 3,
    lastReplyTime: '4h ago',
    lastReplyAuthor: 'David',
    pinned: false
  },
  {
    id: 5,
    title: 'Vinyl pressing quality discussion',
    author: 'VinylLover',
    tag: 'Vinyl',
    replies: 0,
    lastReplyTime: '6h ago',
    lastReplyAuthor: null,
    pinned: false
  }
]

const filteredTopics = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return mockTopics
  return mockTopics.filter((topic) => {
    return (
      topic.title.toLowerCase().includes(q)
      || topic.author.toLowerCase().includes(q)
      || (topic.tag || '').toLowerCase().includes(q)
    )
  })
})
</script>
