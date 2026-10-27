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
const kinds: { key: Kind, icon: string }[] = [
  { key: 'album', icon: 'lucide:disc-3' },
  { key: 'artist', icon: 'lucide:mic-vocal' },
  { key: 'entry', icon: 'lucide:clapperboard' },
  { key: 'franchise', icon: 'lucide:library-big' },
  { key: 'label', icon: 'lucide:building-2' },
]
// The list page the visitor came from marks its row.
const highlighted = computed(() => kinds.some(kind => kind.key === route.query.type) ? route.query.type as Kind : null)
const targetOf = (kind: Kind) => isAuthenticated.value ? `/contribute/${kind}` : { path: '/auth/login', query: { redirect: `/contribute/${kind}` } }

const moreOpen = ref(false)
const details = ['search', 'live', 'review', 'history'] as const

usePageSeo({ title: () => t('contribute_page.seo_title'), description: () => t('contribute_page.summary') })
</script>

<template>
  <div class="min-h-[calc(100vh-3.5rem)]">
    <div class="mx-auto max-w-xl px-4 py-12 md:py-16">
      <h1 class="text-center text-2xl font-bold text-title md:text-3xl">{{ t('contribute_page.title') }}</h1>
      <p class="mt-3 text-center text-sm text-meta">
        {{ t('contribute_page.summary') }}
        <button type="button" class="link ml-1 inline-flex items-center gap-0.5 font-medium" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
          {{ t(moreOpen ? 'contribute_page.less' : 'contribute_page.more') }}
          <Icon name="lucide:chevron-down" class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': moreOpen }" />
        </button>
      </p>

      <ul v-if="moreOpen" class="card mt-4 space-y-2 p-4 text-[13px] leading-6 text-body">
        <li v-for="item in details" :key="item" class="flex gap-2">
          <Icon name="lucide:check" class="mt-1 h-3.5 w-3.5 shrink-0 text-success" />{{ t(`contribute_page.details.${item}`) }}
        </li>
      </ul>

      <ul class="card mt-8 divide-y divide-line overflow-hidden">
        <li v-for="kind in kinds" :key="kind.key">
          <NuxtLink
            :to="targetOf(kind.key)"
            class="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-card-hover active:bg-card-active"
            :class="{ 'bg-primary/10': highlighted === kind.key }"
          >
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><Icon :name="kind.icon" class="h-5 w-5" /></span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold text-title">{{ t(`contribute_page.kinds.${kind.key}.title`) }}</span>
              <span class="mt-0.5 block truncate text-sm text-meta">{{ t(`contribute_page.kinds.${kind.key}.desc`) }}</span>
            </span>
            <Icon name="lucide:chevron-right" class="h-5 w-5 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </NuxtLink>
        </li>
      </ul>

      <p class="mt-4 text-center text-xs text-meta">
        <template v-if="isAuthenticated">
          <NuxtLink to="/revisions" class="link link-muted">{{ t('contribute_page.my_revisions') }}</NuxtLink>
        </template>
        <template v-else>{{ t('contribute_page.guest_note') }}</template>
      </p>
    </div>
  </div>
</template>
