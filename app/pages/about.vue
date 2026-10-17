<template>
  <div class="relative min-h-[calc(100vh-4rem)] overflow-hidden">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-linear-to-br from-sky-200/45 to-indigo-200/20 blur-3xl" />
      <div class="absolute top-20 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-orange-200/35 to-pink-200/15 blur-3xl" />
      <div class="absolute -bottom-52 left-1/3 h-120 w-120 rounded-full bg-linear-to-br from-emerald-200/35 to-cyan-200/15 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
    </div>

    <div class="relative container mx-auto max-w-6xl 2xl:max-w-7xl space-y-8 px-4 py-10 md:px-6 md:py-14">
      <section class="rounded-3xl border border-sky-100/80 bg-linear-to-br from-white via-sky-50/70 to-indigo-50/80 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.5)] ring-1 ring-black/5 backdrop-blur-xl md:p-8">
        <div class="max-w-4xl">
          <p class="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-100/65 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700">
            <Icon name="lucide:cat" class="h-3.5 w-3.5" />
            {{ t('about_page.label') }}
          </p>
          <h1 class="mt-4 flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            <span class="inline-flex rounded-xl bg-amber-100 p-1.5 md:p-2">
              <Icon name="lucide:sparkles" class="h-5 w-5 text-amber-600 md:h-6 md:w-6" />
            </span>
            CDCAT
          </h1>
          <p class="mt-4 text-[15px] leading-7 text-slate-700 md:text-base">
            {{ t('about_page.intro') }}
          </p>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <div
            v-for="(item, index) in highlights"
            :key="item.title"
            class="rounded-2xl border bg-white/90 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            :class="[item.tone, index === 0 ? 'sm:col-span-2 2xl:col-span-3' : '']"
          >
            <div class="mb-2 inline-flex rounded-lg p-1.5" :class="item.iconBg">
              <Icon :name="item.icon" class="h-4 w-4" :class="item.iconTone" />
            </div>
            <p class="text-base font-semibold text-slate-900">{{ item.title }}</p>
            <p class="mt-2 text-[13px] leading-6 text-slate-600">{{ item.desc }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-blue-100/80 bg-linear-to-br from-white via-blue-50/70 to-sky-50/80 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] ring-1 ring-black/5 backdrop-blur-xl md:p-8">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <span class="inline-flex rounded-lg bg-blue-100 p-1.5">
                <Icon name="lucide:book-open-check" class="h-5 w-5 text-blue-700" />
              </span>
              {{ t('about_page.guides_title') }}
            </h2>
            <p class="mt-2 text-sm text-slate-600">
              {{ t('about_page.guides_desc') }}
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <article
            v-for="guide in usageGuides"
            :key="guide.title"
            class="group rounded-2xl border bg-white/90 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            :class="guide.tone"
          >
            <div class="inline-flex rounded-lg p-1.5" :class="guide.iconBg">
              <Icon :name="guide.icon" class="h-4 w-4" :class="guide.iconTone" />
            </div>
            <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-600">{{ guide.tag }}</p>
            <h3 class="mt-2 text-lg font-semibold text-slate-900">{{ guide.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-700">{{ guide.desc }}</p>
            <NuxtLink
              :to="guide.link"
              class="mt-4 inline-flex items-center text-sm font-medium text-slate-900 transition-colors duration-150 group-hover:text-sky-700"
            >
              {{ t('common.view') }}
            </NuxtLink>
          </article>
        </div>
      </section>

      <section class="space-y-6">
        <article class="rounded-3xl border border-indigo-100/80 bg-linear-to-br from-white via-indigo-50/75 to-blue-50/70 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] ring-1 ring-black/5 backdrop-blur-xl">
          <h2 class="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <span class="inline-flex rounded-lg bg-indigo-100 p-1.5">
              <Icon name="lucide:file-code-2" class="h-5 w-5 text-indigo-700" />
            </span>
            {{ t('about_page.docs_title') }}
          </h2>
          <p class="mt-2 text-sm text-slate-600">{{ t('about_page.docs_desc') }}</p>
          <div class="mt-5 space-y-3">
            <NuxtLink
              v-for="doc in docs"
              :key="doc.name"
              :to="doc.link"
              class="flex items-center justify-between rounded-xl border border-indigo-100/90 bg-white/85 px-4 py-3 transition-all duration-150 hover:border-indigo-200 hover:bg-indigo-50/55"
            >
              <div class="flex items-start gap-2.5">
                <div class="rounded-md p-1.5" :class="doc.iconBg">
                  <Icon :name="doc.icon" class="h-4 w-4" :class="doc.iconTone" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ doc.name }}</p>
                  <p class="text-xs text-slate-500">{{ doc.desc }}</p>
                </div>
              </div>
              <span class="text-xs font-medium text-indigo-600">{{ t('common.view') }}</span>
            </NuxtLink>
          </div>
        </article>

        <article class="rounded-3xl border border-rose-100/80 bg-linear-to-br from-white via-rose-50/70 to-orange-50/70 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] ring-1 ring-black/5 backdrop-blur-xl">
          <h2 class="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <span class="inline-flex rounded-lg bg-rose-100 p-1.5">
              <Icon name="lucide:messages-square" class="h-5 w-5 text-rose-700" />
            </span>
            {{ t('about_page.community_title') }}
          </h2>
          <p class="mt-2 text-sm text-slate-600">{{ t('about_page.community_desc') }}</p>
          <div class="mt-5 space-y-3">
            <div
              v-for="group in communities"
              :key="group.name"
              class="rounded-xl border bg-white/85 px-4 py-3"
              :class="group.tone"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <div class="rounded-md p-1.5" :class="group.iconBg">
                    <Icon :name="group.icon" class="h-4 w-4" :class="group.iconTone" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">{{ group.name }}</p>
                    <p class="text-xs text-slate-500">{{ group.code }}</p>
                  </div>
                </div>
                <NuxtLink :to="group.link" class="text-xs font-medium text-rose-700 hover:text-rose-800">
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
const { t } = useI18n()

const highlights = computed(() => [
  {
    title: t('about_page.highlights.archive_title'),
    desc: t('about_page.highlights.archive_desc'),
    icon: 'lucide:book-marked',
    tone: 'border-slate-200/80',
    iconBg: 'bg-sky-100',
    iconTone: 'text-sky-700'
  },
  {
    title: t('about_page.highlights.timeline_title'),
    desc: t('about_page.highlights.timeline_desc'),
    icon: 'lucide:disc-3',
    tone: 'border-slate-200/80',
    iconBg: 'bg-indigo-100',
    iconTone: 'text-indigo-700'
  },
  {
    title: t('about_page.highlights.creator_title'),
    desc: t('about_page.highlights.creator_desc'),
    icon: 'lucide:badge-check',
    tone: 'border-slate-200/80',
    iconBg: 'bg-emerald-100',
    iconTone: 'text-emerald-700'
  },
  {
    title: t('about_page.highlights.developer_title'),
    desc: t('about_page.highlights.developer_desc'),
    icon: 'lucide:file-code-2',
    tone: 'border-slate-200/80',
    iconBg: 'bg-amber-100',
    iconTone: 'text-amber-700'
  },
  {
    title: t('about_page.highlights.relations_title'),
    desc: t('about_page.highlights.relations_desc'),
    icon: 'lucide:list-checks',
    tone: 'border-slate-200/80',
    iconBg: 'bg-rose-100',
    iconTone: 'text-rose-700'
  },
  {
    title: t('about_page.highlights.community_title'),
    desc: t('about_page.highlights.community_desc'),
    icon: 'lucide:headphones',
    tone: 'border-slate-200/80',
    iconBg: 'bg-violet-100',
    iconTone: 'text-violet-700'
  },
  {
    title: t('about_page.highlights.stories_title'),
    desc: t('about_page.highlights.stories_desc'),
    icon: 'lucide:mic-2',
    tone: 'border-slate-200/80',
    iconBg: 'bg-cyan-100',
    iconTone: 'text-cyan-700'
  }
])

const usageGuides = computed(() => [
  {
    tag: t('about_page.guide_basics_tag'),
    title: t('about_page.guide_basics_title'),
    desc: t('about_page.guide_basics_desc'),
    link: '#',
    icon: 'lucide:plus-circle',
    tone: 'border-slate-200/80',
    iconBg: 'bg-cyan-100',
    iconTone: 'text-cyan-700'
  },
  {
    tag: t('about_page.guide_research_tag'),
    title: t('about_page.guide_research_title'),
    desc: t('about_page.guide_research_desc'),
    link: '#',
    icon: 'lucide:scan-search',
    tone: 'border-slate-200/80',
    iconBg: 'bg-blue-100',
    iconTone: 'text-blue-700'
  },
  {
    tag: t('about_page.guide_submit_tag'),
    title: t('about_page.guide_submit_title'),
    desc: t('about_page.guide_submit_desc'),
    link: '#',
    icon: 'lucide:badge-check',
    tone: 'border-slate-200/80',
    iconBg: 'bg-teal-100',
    iconTone: 'text-teal-700'
  },
])

const docs = computed(() => [
  { name: t('about_page.api_docs'), desc: t('about_page.api_docs_desc'), link: '#', icon: 'lucide:braces', iconBg: 'bg-indigo-100', iconTone: 'text-indigo-700' },
  { name: t('about_page.frontend_repo'), desc: t('about_page.frontend_repo_desc'), link: '#', icon: 'lucide:github', iconBg: 'bg-blue-100', iconTone: 'text-blue-700' }
])

const communities = computed(() => [
  {
    name: t('about_page.qq_group'),
    code: t('about_page.qq_code'),
    link: '#',
    icon: 'lucide:message-circle',
    tone: 'border-slate-200/80',
    iconBg: 'bg-rose-100',
    iconTone: 'text-rose-700'
  },
  {
    name: t('about_page.telegram_group'),
    code: t('common.coming_soon'),
    link: '#',
    icon: 'lucide:send',
    tone: 'border-slate-200/80',
    iconBg: 'bg-orange-100',
    iconTone: 'text-orange-700'
  },
  {
    name: t('about_page.discord_group'),
    code: t('common.coming_soon'),
    link: '#',
    icon: 'lucide:messages-square',
    tone: 'border-slate-200/80',
    iconBg: 'bg-pink-100',
    iconTone: 'text-pink-700'
  }
])

useHead({
  title: computed(() => t('menu.about'))
})
</script>
