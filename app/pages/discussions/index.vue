<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <!-- Decorative background -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-linear-to-br from-blue-200/70 to-indigo-200/30 blur-3xl" />
      <div class="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-linear-to-br from-amber-200/50 to-rose-200/20 blur-3xl" />
      <div class="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-linear-to-br from-emerald-200/40 to-cyan-200/20 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
    </div>

    <div class="relative container mx-auto px-4 md:px-6 py-10 max-w-6xl">
      <!-- Header -->
      <div class="mb-10 flex items-start justify-between gap-6">
        <div>
          <p class="text-xs font-medium text-gray-500 tracking-wide uppercase">
            Community
          </p>
          <h1 class="mt-2 text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
            {{ $t('menu.discussion') }}
          </h1>
          <p class="mt-2 text-sm text-gray-500 max-w-2xl">
            {{ $t('discussion.description') }}
          </p>
        </div>
      </div>

      <!-- Language Sections Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <NuxtLink
          v-for="section in sections"
          :key="section.lang"
          :to="`/discussions/${section.lang}`"
          class="group relative rounded-2xl ring-1 ring-black/5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:ring-black/10"
        >
          <div class="absolute inset-0 bg-white/70 backdrop-blur-xl" />
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-linear-to-br from-white/40 to-white/10" />

          <!-- Color accent bar -->
          <div class="relative h-1 w-full" :class="section.accent" />

          <div class="relative px-6 py-5 flex items-center gap-4">
            <!-- Icon circle -->
            <div
              class="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-transform duration-200 group-hover:scale-105 ring-1 ring-black/5 shadow-sm"
              :class="section.iconBg"
            >
              {{ section.char }}
            </div>

            <div class="flex-1 min-w-0">
              <h2 class="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {{ section.label }}
              </h2>
              <p class="text-xs text-gray-400 mt-0.5">{{ section.subtitle }}</p>
            </div>

            <Icon name="lucide:chevron-right" class="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Discussion | CDCAT'
})

const { t } = useI18n()

const sections = computed(() => [
  { lang: 'ja', char: 'あ', label: t('discussion.lang.ja'), subtitle: '日本語', accent: 'bg-red-400', iconBg: 'bg-red-50 text-red-500' },
  { lang: 'en', char: 'En', label: t('discussion.lang.en'), subtitle: 'English', accent: 'bg-blue-400', iconBg: 'bg-blue-50 text-blue-500' },
  { lang: 'ko', char: '한', label: t('discussion.lang.ko'), subtitle: '한국어', accent: 'bg-violet-400', iconBg: 'bg-violet-50 text-violet-500' },
  { lang: 'zh', char: '中', label: t('discussion.lang.zh'), subtitle: '中文', accent: 'bg-amber-400', iconBg: 'bg-amber-50 text-amber-600' },
  { lang: 'other', char: '...', label: t('discussion.lang.other'), subtitle: '', accent: 'bg-gray-400', iconBg: 'bg-gray-100 text-gray-500' }
])
</script>
