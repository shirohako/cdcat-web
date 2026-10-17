<script setup lang="ts">
import { Search } from '@lucide/vue'

/** The forum home: the category navigation and the latest topics from every category. */
const { t } = useI18n()
const router = useRouter()
const query = ref('')
const search = () => { if (query.value.trim().length >= 2) router.push({ path: '/discussions/search', query: { q: query.value.trim() } }) }
useSeoMeta({ title: () => t('discussions.title'), description: () => t('discussions.description') })
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)] bg-slate-50/60">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{{ t('discussions.title') }}</h1>
          <p class="mt-1 text-sm text-slate-500">{{ t('discussions.description') }}</p>
        </div>
        <form class="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-sky-400 lg:flex" role="search" @submit.prevent="search">
          <Search :size="15" class="text-slate-400" />
          <input v-model="query" type="search" maxlength="100" class="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400" :placeholder="t('discussions.search.placeholder')">
        </form>
      </header>
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <DiscussionSidebar class="lg:sticky lg:top-20 lg:w-64 lg:shrink-0" />
        <main class="min-w-0 flex-1">
          <DiscussionListView />
        </main>
      </div>
    </div>
    <DiscussionNotice />
  </div>
</template>
