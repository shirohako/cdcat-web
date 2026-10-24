<template>
  <div class="relative min-h-[calc(100vh-4rem)] overflow-hidden">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-linear-to-br from-primary/15 to-primary/5 blur-3xl" />
      <div class="absolute top-20 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-3xl" />
      <div class="absolute -bottom-52 left-1/3 h-120 w-120 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--line)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
    </div>

    <div class="relative container mx-auto max-w-6xl 2xl:max-w-7xl space-y-8 px-4 py-10 md:px-6 md:py-14">
      <section class="card bg-linear-to-br from-primary/10 to-transparent p-6 md:p-8">
        <div class="max-w-4xl">
          <p class="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            <Icon name="lucide:cat" class="h-3.5 w-3.5" />
            {{ t('about_page.label') }}
          </p>
          <h1 class="mt-4 flex items-center gap-2 text-3xl font-bold tracking-tight text-title md:text-4xl">
            <span class="inline-flex rounded-xl bg-primary/15 p-1.5 md:p-2">
              <Icon name="lucide:sparkles" class="h-5 w-5 text-primary md:h-6 md:w-6" />
            </span>
            CDCAT
          </h1>
          <p class="mt-4 text-[15px] leading-7 text-body md:text-base">
            {{ t('about_page.intro') }}
          </p>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <div
            v-for="(item, index) in highlights"
            :key="item.title"
            class="rounded-xl bg-sunken p-5"
            :class="index === 0 ? 'sm:col-span-2 2xl:col-span-3' : ''"
          >
            <div class="mb-2 inline-flex rounded-lg bg-primary/15 p-1.5">
              <Icon :name="item.icon" class="h-4 w-4 text-primary" />
            </div>
            <p class="text-base font-semibold text-title">{{ item.title }}</p>
            <p class="mt-2 text-[13px] leading-6 text-body">{{ item.desc }}</p>
          </div>
        </div>
      </section>

      <section class="card p-6 md:p-8">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-title">
              <span class="inline-flex rounded-lg bg-primary/15 p-1.5">
                <Icon name="lucide:book-open-check" class="h-5 w-5 text-primary" />
              </span>
              {{ t('about_page.guides_title') }}
            </h2>
            <p class="mt-2 text-sm text-body">
              {{ t('about_page.guides_desc') }}
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <article
            v-for="guide in usageGuides"
            :key="guide.title"
            class="group rounded-xl bg-sunken p-5"
          >
            <div class="inline-flex rounded-lg bg-primary/15 p-1.5">
              <Icon :name="guide.icon" class="h-4 w-4 text-primary" />
            </div>
            <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">{{ guide.tag }}</p>
            <h3 class="mt-2 text-lg font-semibold text-title">{{ guide.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-body">{{ guide.desc }}</p>
            <NuxtLink
              v-if="guide.link"
              :to="guide.link"
              class="mt-4 inline-flex items-center text-sm font-medium text-title transition-colors duration-150 ease-out group-hover:text-primary"
            >
              {{ t('common.view') }}
            </NuxtLink>
            <span v-else class="mt-4 inline-flex items-center text-sm text-meta">{{ t('common.coming_soon') }}</span>
          </article>
        </div>
      </section>

      <section class="space-y-6">
        <article class="card p-6">
          <h2 class="flex items-center gap-2 text-xl font-bold tracking-tight text-title">
            <span class="inline-flex rounded-lg bg-primary/15 p-1.5">
              <Icon name="lucide:file-code-2" class="h-5 w-5 text-primary" />
            </span>
            {{ t('about_page.docs_title') }}
          </h2>
          <p class="mt-2 text-sm text-body">{{ t('about_page.docs_desc') }}</p>
          <div class="mt-5 space-y-3">
            <component
              :is="doc.link ? NuxtLink : 'div'"
              v-for="doc in docs"
              :key="doc.name"
              :to="doc.link ?? undefined"
              class="flex items-center justify-between rounded-xl bg-sunken px-4 py-3 transition-colors duration-150 ease-out"
              :class="{ 'hover:bg-card-hover active:bg-card-active': doc.link }"
            >
              <div class="flex items-start gap-2.5">
                <div class="rounded-md bg-primary/15 p-1.5">
                  <Icon :name="doc.icon" class="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-title">{{ doc.name }}</p>
                  <p class="text-xs text-meta">{{ doc.desc }}</p>
                </div>
              </div>
              <span v-if="doc.link" class="text-xs font-medium text-primary">{{ t('common.view') }}</span>
              <span v-else class="text-xs text-meta">{{ t('common.coming_soon') }}</span>
            </component>
          </div>
        </article>

        <article class="card p-6">
          <h2 class="flex items-center gap-2 text-xl font-bold tracking-tight text-title">
            <span class="inline-flex rounded-lg bg-primary/15 p-1.5">
              <Icon name="lucide:messages-square" class="h-5 w-5 text-primary" />
            </span>
            {{ t('about_page.community_title') }}
          </h2>
          <p class="mt-2 text-sm text-body">{{ t('about_page.community_desc') }}</p>
          <div class="mt-5 space-y-3">
            <div
              v-for="group in communities"
              :key="group.name"
              class="rounded-xl bg-sunken px-4 py-3"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <div class="rounded-md bg-primary/15 p-1.5">
                    <Icon :name="group.icon" class="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-title">{{ group.name }}</p>
                    <p class="text-xs text-meta">{{ group.code }}</p>
                  </div>
                </div>
                <NuxtLink v-if="group.link" :to="group.link" class="link text-xs font-medium">
                  {{ t('common.view') }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </article>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

const { t } = useI18n()

const highlights = computed(() => [
  {
    title: t('about_page.highlights.archive_title'),
    desc: t('about_page.highlights.archive_desc'),
    icon: 'lucide:book-marked'
  },
  {
    title: t('about_page.highlights.timeline_title'),
    desc: t('about_page.highlights.timeline_desc'),
    icon: 'lucide:disc-3'
  },
  {
    title: t('about_page.highlights.creator_title'),
    desc: t('about_page.highlights.creator_desc'),
    icon: 'lucide:badge-check'
  },
  {
    title: t('about_page.highlights.developer_title'),
    desc: t('about_page.highlights.developer_desc'),
    icon: 'lucide:file-code-2'
  },
  {
    title: t('about_page.highlights.relations_title'),
    desc: t('about_page.highlights.relations_desc'),
    icon: 'lucide:list-checks'
  },
  {
    title: t('about_page.highlights.community_title'),
    desc: t('about_page.highlights.community_desc'),
    icon: 'lucide:headphones'
  },
  {
    title: t('about_page.highlights.stories_title'),
    desc: t('about_page.highlights.stories_desc'),
    icon: 'lucide:mic-2'
  }
])

const usageGuides = computed(() => [
  {
    tag: t('about_page.guide_basics_tag'),
    title: t('about_page.guide_basics_title'),
    desc: t('about_page.guide_basics_desc'),
    link: null as string | null,
    icon: 'lucide:plus-circle'
  },
  {
    tag: t('about_page.guide_research_tag'),
    title: t('about_page.guide_research_title'),
    desc: t('about_page.guide_research_desc'),
    link: null as string | null,
    icon: 'lucide:scan-search'
  },
  {
    tag: t('about_page.guide_submit_tag'),
    title: t('about_page.guide_submit_title'),
    desc: t('about_page.guide_submit_desc'),
    link: null as string | null,
    icon: 'lucide:badge-check'
  },
])

const docs = computed(() => [
  { name: t('about_page.api_docs'), desc: t('about_page.api_docs_desc'), link: null as string | null, icon: 'lucide:braces' },
  { name: t('about_page.frontend_repo'), desc: t('about_page.frontend_repo_desc'), link: null as string | null, icon: 'lucide:github' }
])

const communities = computed(() => [
  {
    name: t('about_page.qq_group'),
    code: t('about_page.qq_code'),
    link: null as string | null,
    icon: 'lucide:message-circle'
  },
  {
    name: t('about_page.telegram_group'),
    code: t('common.coming_soon'),
    link: null as string | null,
    icon: 'lucide:send'
  },
  {
    name: t('about_page.discord_group'),
    code: t('common.coming_soon'),
    link: null as string | null,
    icon: 'lucide:messages-square'
  }
])

usePageSeo({
  title: () => t('menu.about'),
  description: () => t('seo.pages.about'),
})
</script>
