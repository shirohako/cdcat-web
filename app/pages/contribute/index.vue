<script setup lang="ts">
/**
 * Where every "new" button leads: one question, what to add, with the review rules folded
 * away under "learn more". Open to guests; picking a kind needs an account, so guests go
 * through the login page and land in the editor. Rules: docs/catalog/editing.md.
 */
const route = useRoute()
const { t } = useI18n()
const { isAuthenticated } = useAuth()

type Kind = 'album' | 'artist' | 'entry' | 'franchise' | 'label'
const kinds: { key: Kind, icon: string, tone: string }[] = [
  { key: 'album', icon: 'lucide:disc-3', tone: 'bg-sky-50 text-sky-600' },
  { key: 'artist', icon: 'lucide:mic-vocal', tone: 'bg-rose-50 text-rose-600' },
  { key: 'entry', icon: 'lucide:clapperboard', tone: 'bg-pink-50 text-pink-600' },
  { key: 'franchise', icon: 'lucide:library-big', tone: 'bg-indigo-50 text-indigo-600' },
  { key: 'label', icon: 'lucide:building-2', tone: 'bg-amber-50 text-amber-600' },
]
// The list page the visitor came from marks its row.
const highlighted = computed(() => kinds.some(kind => kind.key === route.query.type) ? route.query.type as Kind : null)
const targetOf = (kind: Kind) => isAuthenticated.value ? `/contribute/${kind}` : { path: '/auth/login', query: { redirect: `/contribute/${kind}` } }

const moreOpen = ref(false)
const details = ['search', 'live', 'review', 'history'] as const

useSeoMeta({ title: () => t('contribute_page.seo_title'), description: () => t('contribute_page.summary') })
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-slate-50/60">
    <div class="mx-auto max-w-xl px-4 py-12 md:py-16">
      <h1 class="text-center text-2xl font-bold text-slate-900 md:text-3xl">{{ t('contribute_page.title') }}</h1>
      <p class="mt-3 text-center text-sm text-slate-500">
        {{ t('contribute_page.summary') }}
        <button type="button" class="ml-1 inline-flex items-center gap-0.5 font-medium text-sky-600 hover:underline" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
          {{ t(moreOpen ? 'contribute_page.less' : 'contribute_page.more') }}
          <Icon name="lucide:chevron-down" class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': moreOpen }" />
        </button>
      </p>

      <ul v-if="moreOpen" class="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-[13px] leading-6 text-slate-600">
        <li v-for="item in details" :key="item" class="flex gap-2">
          <Icon name="lucide:check" class="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />{{ t(`contribute_page.details.${item}`) }}
        </li>
      </ul>

      <ul class="mt-8 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <li v-for="kind in kinds" :key="kind.key">
          <NuxtLink
            :to="targetOf(kind.key)"
            class="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
            :class="{ 'bg-sky-50/60': highlighted === kind.key }"
          >
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" :class="kind.tone"><Icon :name="kind.icon" class="h-5 w-5" /></span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold text-slate-900">{{ t(`contribute_page.kinds.${kind.key}.title`) }}</span>
              <span class="mt-0.5 block truncate text-sm text-slate-500">{{ t(`contribute_page.kinds.${kind.key}.desc`) }}</span>
            </span>
            <Icon name="lucide:chevron-right" class="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </NuxtLink>
        </li>
      </ul>

      <p class="mt-4 text-center text-xs text-slate-400">
        <template v-if="isAuthenticated">
          <NuxtLink to="/revisions" class="hover:text-slate-600 hover:underline">{{ t('contribute_page.my_revisions') }}</NuxtLink>
        </template>
        <template v-else>{{ t('contribute_page.guest_note') }}</template>
      </p>
    </div>
  </div>
</template>
