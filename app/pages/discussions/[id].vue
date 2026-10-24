<script setup lang="ts">
import { ArrowDownWideNarrow, CheckCircle2, ChevronRight, Eye, Lock, MessageSquare, Pencil, Pin, RefreshCw, Shield, Star, UserRound } from '@lucide/vue'
import { markdownQuote } from '~/utils/markdownEditor'
import type { DiscussionPost, DiscussionReferences, DiscussionTopicDetail, DiscussionTopicPage } from '~/types/discussion'

/**
 * The topic page: 20 floors per page with their first sub-replies, quoting and
 * replying, reactions, moderation, read tracking and polling for new replies.
 * `?floor=`, `?post=` and `?unread=1` open the page holding that post.
 */
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const config = useRuntimeConfig()
const { $api } = useNuxtApp()
const { isAuthenticated, token } = useAuth()
const { localizeError } = useLocalizedApiError()
const { categoryName } = useDiscussionCategories()
const { tagName } = useTags()
const { ago, exact } = useRelativeTime()
const notice = useDiscussionNotice()
const topicId = computed(() => Number(route.params.id))

const query = computed(() => ({
  page: route.query.page ? Number(route.query.page) : undefined,
  floor: route.query.floor ? Number(route.query.floor) : undefined,
  post: route.query.post ? Number(route.query.post) : undefined,
  unread: route.query.unread === '1' ? 1 : undefined,
  author: route.query.author === 'op' ? 'op' : undefined,
  order: route.query.order === 'desc' ? 'desc' : undefined,
}))
// Always fetched fresh (no revisit cache): replies, read positions and polling all start from it.
const { data, status, error, refresh, pending } = await usePageData(() => `discussion-topic-${topicId.value}`,
  ({ signal }) => $api<DiscussionTopicPage>(`/v1/discussions/topics/${topicId.value}`, { query: query.value, signal }), { cache: false, watch: [query] })

// An article's comment topic lives on the article page; go there while the article is on the site.
const articlePath = (value: DiscussionTopicPage | null | undefined) => {
  const article = value?.topic.article
  return article?.status === 'published' ? `/articles/${article.id}${article.slug ? `/${article.slug}` : ''}#comments` : null
}
if (articlePath(data.value)) await navigateTo(articlePath(data.value)!, { replace: true, redirectCode: 302 })
watch(data, (value) => { if (articlePath(value)) void navigateTo(articlePath(value)!, { replace: true }) })
const redirecting = computed(() => !!articlePath(data.value))

// A link to a post (?post=, ?floor=, ?unread=1) scrolls to that post itself (scrollToFocus), not to the top.
definePageMeta({
  scrollToTop: to => !(to.query.post || to.query.floor || to.query.unread),
})

const topic = ref<DiscussionTopicDetail>(data.value?.topic as DiscussionTopicDetail)
const floors = ref<DiscussionPost[]>(data.value?.floors ?? [])
const references = ref<DiscussionReferences>(data.value?.references ?? {})
const focusId = ref<number | null>(data.value?.focus?.post_id ?? null)
watch(data, (value) => {
  if (!value) return
  topic.value = value.topic
  floors.value = value.floors
  references.value = value.references
  focusId.value = value.focus?.post_id ?? null
})

const composer = ref<{ insert: (text: string) => void, focus: () => void } | null>(null)
const composerSection = useTemplateRef<HTMLElement>('composerSection')
const reportPostId = ref<number | null>(null)
const moderating = ref<DiscussionPost | null>(null)
const editingTopic = ref<DiscussionTopicDetail | null>(null)
const moderatingTopic = ref<DiscussionTopicDetail | null>(null)
const moderator = computed(() => topic.value?.viewer.can.moderate ?? false)

provideDiscussionTopic({
  topic: topic as Ref<DiscussionTopicDetail>,
  references,
  focusId,
  mergeReferences: (incoming) => { references.value = mergeDiscussionReferences(references.value, incoming) },
  quote: (post, selection) => {
    if (!post.raw) return
    composer.value?.insert(markdownQuote(post.id, selection || post.raw))
    composerSection.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  },
  report: (post) => { reportPostId.value = post.id },
  moderate: (post) => { moderating.value = post },
  accept: async (post) => {
    try {
      if (post) await $api(`/v1/discussions/topics/${topicId.value}/accepted`, { method: 'PUT', body: { post_id: post.id } })
      else await $api(`/v1/discussions/topics/${topicId.value}/accepted`, { method: 'DELETE' })
      notice.success(post ? t('discussions.answer.accepted') : t('discussions.answer.unaccepted'))
      await refresh()
    }
    catch (failure) {
      notice.error(localizeError(failure))
    }
  },
  updated: post => replacePost(post),
  removed: (post, topicDeleted) => removePost(post, topicDeleted),
})

/** Puts a changed floor or sub-reply back into the page. */
/** The topic no longer exists: back to its category. */
function leaveDeletedTopic() {
  void router.push(topic.value.category ? `/discussions/c/${topic.value.category.slug}` : '/discussions')
}

/** Takes a deleted post off the page; a deleted #1 means the topic is gone. */
function removePost(post: DiscussionPost, topicDeleted: boolean) {
  if (topicDeleted) {
    leaveDeletedTopic()
    return
  }
  floors.value = post.parent_id === null
    ? floors.value.filter(floor => floor.id !== post.id)
    : floors.value.map(floor => floor.id === post.parent_id ? { ...floor, replies: (floor.replies ?? []).filter(reply => reply.id !== post.id), replies_count: Math.max(0, floor.replies_count - 1) } : floor)
}

function replacePost(post: DiscussionPost) {
  if (post.parent_id === null) {
    floors.value = floors.value.map(floor => floor.id === post.id ? { ...floor, ...post, replies: post.replies ?? floor.replies } : floor)
    return
  }
  floors.value = floors.value.map(floor => floor.id === post.parent_id
    ? { ...floor, replies: (floor.replies ?? []).map(reply => reply.id === post.id ? post : reply) }
    : floor)
}

// ===== Paging =====

const pagination = computed(() => data.value?.pagination)
const authorOnly = computed(() => data.value?.mode.author === 'op')
const descending = computed(() => data.value?.mode.order === 'desc')
const go = (changes: Record<string, string | number | null | undefined>) => {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, floor: undefined, post: undefined, unread: undefined, ...changes })) {
    if (value !== undefined && value !== null && value !== '') next[key] = String(value)
  }
  router.push({ query: next })
}
const jump = ref('')
const jumpToFloor = () => {
  const floor = Number.parseInt(jump.value)
  if (floor > 0) go({ floor, page: null, author: null, order: null })
  jump.value = ''
}

// ===== Read position and new replies =====

let seenMax = 0
let reportedMax = 0
let observer: IntersectionObserver | undefined
let readTimer: ReturnType<typeof setInterval> | undefined
let pollTimer: ReturnType<typeof setInterval> | undefined
const tracking = computed(() => isAuthenticated.value && !authorOnly.value && !descending.value)
const newActivity = ref<{ new_floors: number, new_replies: Record<string, number> } | null>(null)
const newCount = computed(() => (newActivity.value?.new_floors ?? 0) + Object.values(newActivity.value?.new_replies ?? {}).reduce((sum, count) => sum + count, 0))
const loadedMax = () => Math.max(0, ...floors.value.flatMap(floor => [floor.id, ...(floor.replies ?? []).map(reply => reply.id)]))

const apiUrl = (path: string) => `${String(config.public.apiBaseUrl ?? '').replace(/\/$/, '')}${path}`
/** Sends the read position. On leaving the page the request uses `keepalive`; sendBeacon cannot carry the token. */
function sendRead(keepalive = false) {
  if (!tracking.value || seenMax <= reportedMax) return
  reportedMax = seenMax
  const body = JSON.stringify({ post_id: seenMax })
  if (keepalive) {
    void fetch(apiUrl(`/v1/discussions/topics/${topicId.value}/read`), {
      method: 'PUT', keepalive: true, body, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token.value}` },
    }).catch(() => {})
    return
  }
  $api(`/v1/discussions/topics/${topicId.value}/read`, { method: 'PUT', body: { post_id: seenMax }, progress: false }).catch(() => { reportedMax = 0 })
}

/** The page sits outside the document until the previous page has faded out; DOM work waits for it. */
let mounted = false

function observe() {
  observer?.disconnect()
  if (!mounted || !tracking.value) return
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      seenMax = Math.max(seenMax, Number((entry.target as HTMLElement).dataset.postId) || 0)
    }
  }, { threshold: 0.4 })
  document.querySelectorAll<HTMLElement>('.discussion-post[data-post-id]').forEach(element => observer!.observe(element))
}

async function poll() {
  if (document.visibilityState !== 'visible' || !topic.value) return
  try {
    const activity = await $api<{ new_floors: number, new_replies: Record<string, number> }>(`/v1/discussions/topics/${topicId.value}/activity`, { query: { after_post_id: loadedMax() }, progress: false })
    newActivity.value = activity.new_floors || Object.keys(activity.new_replies).length ? activity : null
  }
  catch { /* try again on the next tick */ }
}

async function showNew() {
  newActivity.value = null
  if (pagination.value && pagination.value.current_page < pagination.value.last_page) go({ unread: 1, page: null })
  else await refresh()
}

const onVisibility = () => { if (document.visibilityState === 'hidden') sendRead(true) }
const onLeave = () => sendRead(true)

async function scrollToFocus() {
  await nextTick()
  if (!mounted || !focusId.value) return
  document.getElementById(`post-${focusId.value}`)?.scrollIntoView({ block: 'center' })
}

onMounted(() => {
  mounted = true
  observe()
  void scrollToFocus()
  readTimer = setInterval(() => sendRead(), 5000)
  pollTimer = setInterval(poll, 60_000)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', onLeave)
})
watch(floors, async () => { await nextTick(); observe() }, { flush: 'post' })
watch(data, () => { void scrollToFocus() })
onBeforeUnmount(() => {
  sendRead(true)
  observer?.disconnect()
  clearInterval(readTimer)
  clearInterval(pollTimer)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pagehide', onLeave)
})

// ===== Writing =====

async function posted(post: DiscussionPost, incoming: DiscussionReferences, lastFloor: number) {
  references.value = mergeDiscussionReferences(references.value, incoming)
  const perPage = pagination.value?.per_page ?? 20
  const lastPage = Math.max(1, Math.ceil(lastFloor / perPage))
  notice.success(t('discussions.composer.posted'))
  focusId.value = post.id
  if (!authorOnly.value && !descending.value && pagination.value?.current_page === lastPage) {
    floors.value = [...floors.value, { ...post, replies: [] }]
    topic.value = { ...topic.value, replies_count: topic.value.replies_count + 1 }
    await scrollToFocus()
  }
  else {
    go({ post: post.id, page: null, author: null, order: null })
  }
}

async function deleteTopic() {
  try {
    await $api(`/v1/discussions/topics/${topicId.value}`, { method: 'DELETE' })
    notice.success(t('discussions.topic.deleted'))
    leaveDeletedTopic()
  }
  catch (failure) {
    notice.error(localizeError(failure))
  }
}
const confirmDeleteTopic = ref(false)

// ===== SEO =====

const firstFloor = computed(() => floors.value.find(floor => floor.floor === 1))
const description = computed(() => {
  const text = firstFloor.value?.status === 'visible' ? (firstFloor.value.raw ?? '') : ''
  // Spoilers never reach the description.
  return text.replace(/\|\|.+?\|\|/g, '▇▇▇').replace(/:::+\s*spoiler[\s\S]*?:::+/g, '▇▇▇').replace(/:::+[^\n]*\n?/g, '').replace(/[#*_>`~=[\]{}()!|-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
})
const canonical = computed(() => config.public.baseUrl
  ? `${String(config.public.baseUrl).replace(/\/$/, '')}/discussions/${topicId.value}${(pagination.value?.current_page ?? 1) > 1 ? `?page=${pagination.value!.current_page}` : ''}` : undefined)
useSeoMeta({
  title: () => topic.value ? `${topic.value.title} - ${categoryName(topic.value.category)}` : t('discussions.title'),
  description: () => description.value || undefined,
  ogTitle: () => topic.value?.title,
  ogDescription: () => description.value || undefined,
  robots: () => topic.value?.noindex ? 'noindex' : undefined,
})
useHead(() => ({
  link: canonical.value ? [{ rel: 'canonical', href: canonical.value }] : [],
  script: topic.value && !topic.value.noindex ? [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      'headline': topic.value.title,
      'text': description.value,
      'url': canonical.value,
      'datePublished': topic.value.created_at,
      'author': topic.value.author ? { '@type': 'Person', 'name': topic.value.author.nickname || topic.value.author.username, 'url': `/profile/${topic.value.author.username}` } : undefined,
      'interactionStatistic': [{ '@type': 'InteractionCounter', 'interactionType': 'https://schema.org/CommentAction', 'userInteractionCount': topic.value.replies_count }],
      'comment': floors.value.filter(floor => floor.floor !== 1 && floor.status === 'visible').map(floor => ({
        '@type': 'Comment',
        'author': { '@type': 'Person', 'name': floor.user.nickname || floor.user.username },
        'datePublished': floor.created_at,
        'text': (floor.raw ?? '').replace(/\|\|.+?\|\|/g, '▇▇▇').slice(0, 500),
      })),
    }),
  }] : [],
}))
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <div class="container mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div v-if="status === 'error' && !topic" class="card p-10 text-center">
        <p class="text-sm text-meta">{{ localizeError(error) }}</p>
        <NuxtLink to="/discussions" class="link mt-3 inline-block text-sm">{{ t('discussions.back') }}</NuxtLink>
      </div>
      <template v-else-if="topic && !redirecting">
        <!-- A page of floors that failed to load: the previous floors stay below. -->
        <CommonLoadError v-if="status === 'error'" class="mb-3" @retry="refresh()" />
        <nav class="mb-3 flex flex-wrap items-center gap-1 text-xs text-meta" :aria-label="t('discussions.breadcrumb')">
          <NuxtLink to="/discussions" class="transition-colors duration-150 ease-out hover:text-primary">{{ t('discussions.title') }}</NuxtLink>
          <template v-if="topic.category?.parent">
            <ChevronRight :size="12" />
            <NuxtLink :to="`/discussions/c/${topic.category.parent.slug}`" class="transition-colors duration-150 ease-out hover:text-primary">{{ categoryName(topic.category.parent) }}</NuxtLink>
          </template>
          <template v-if="topic.category">
            <ChevronRight :size="12" />
            <NuxtLink :to="`/discussions/c/${topic.category.slug}`" class="transition-colors duration-150 ease-out hover:text-primary">{{ categoryName(topic.category) }}</NuxtLink>
          </template>
        </nav>

        <header class="card p-5">
          <div v-if="topic.status !== 'visible'" class="mb-3 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
            {{ t('discussions.topic.hidden_notice') }}
          </div>
          <div class="flex flex-wrap items-start gap-3">
            <h1 class="min-w-0 flex-1 text-xl font-bold leading-snug text-title sm:text-2xl">
              <Pin v-if="topic.pinned" :size="18" class="mr-1 inline text-rose-500 dark:text-rose-400" :aria-label="t('discussions.status.pinned')" />
              <Star v-if="topic.featured" :size="18" class="mr-1 inline fill-amber-400 text-amber-400" :aria-label="t('discussions.status.featured')" />
              <Lock v-if="topic.locked" :size="18" class="mr-1 inline text-meta" :aria-label="t('discussions.status.locked')" />
              {{ topic.title }}
            </h1>
            <div class="flex items-center gap-1.5">
              <DiscussionLevelMenu v-if="isAuthenticated" :level="topic.viewer.notification_level" kind="topic" :target-id="topic.id" @update:level="value => topic.viewer.notification_level = value" />
              <button v-if="topic.viewer.can.edit" type="button" class="btn btn-outline btn-sm btn-square" :aria-label="t('discussions.topic.edit_title')" @click="editingTopic = topic">
                <Pencil :size="14" />
              </button>
              <button v-if="moderator" type="button" class="grid size-8 place-items-center rounded-lg border border-indigo-200 text-indigo-600 transition-colors duration-150 ease-out hover:bg-indigo-50 dark:border-indigo-400/25 dark:text-indigo-400 dark:hover:bg-indigo-400/15" :aria-label="t('discussions.moderation.topic_title')" @click="moderatingTopic = topic">
                <Shield :size="14" />
              </button>
            </div>
          </div>
          <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-meta">
            <DiscussionCategoryBadge :category="topic.category" size="sm" />
            <NuxtLink v-for="tag in topic.tags" :key="tag.id" :to="`/discussions/tags/${tag.slug}`" class="transition-colors duration-150 ease-out hover:text-primary">#{{ tagName(tag) }}</NuxtLink>
            <span class="inline-flex items-center gap-1"><UserRound :size="12" />{{ topic.author?.nickname || topic.author?.username }}</span>
            <time :datetime="topic.created_at ?? undefined" :title="exact(topic.created_at)">{{ ago(topic.created_at) }}</time>
            <span class="inline-flex items-center gap-1"><MessageSquare :size="12" />{{ t('discussions.topic.replies', { count: topic.replies_count }) }}</span>
            <span class="inline-flex items-center gap-1"><Eye :size="12" />{{ t('discussions.topic.views', { count: topic.views_count }) }}</span>
            <NuxtLink v-if="topic.article" :to="`/articles/${topic.article.id}${topic.article.slug ? `/${topic.article.slug}` : ''}`" class="link">{{ t('discussions.topic.article', { title: topic.article.title }) }}</NuxtLink>
          </div>
          <NuxtLink
            v-if="topic.accepted_post" :to="`/discussions/${topic.id}?post=${topic.accepted_post.id}`"
            class="mt-4 flex items-start gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2.5 text-sm transition-colors duration-150 ease-out hover:bg-success/15"
          >
            <CheckCircle2 :size="16" class="mt-0.5 shrink-0 text-success" />
            <span class="min-w-0">
              <span class="font-semibold text-success">{{ t('discussions.answer.summary', { floor: topic.accepted_post.floor, name: topic.accepted_post.user?.nickname || topic.accepted_post.user?.username }) }}</span>
              <span class="mt-0.5 block line-clamp-2 text-body">{{ topic.accepted_post.excerpt }}</span>
            </span>
          </NuxtLink>
        </header>

        <ArticleLinkCards v-if="topic.links.length" :links="topic.links" class="mt-4" />

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" class="inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors duration-150 ease-out" :class="authorOnly ? 'border-primary/40 bg-primary/15 text-primary' : 'border-line text-body hover:bg-ghost-hover hover:text-primary'" @click="go({ author: authorOnly ? null : 'op', page: null })">
            <UserRound :size="13" />{{ t('discussions.topic.only_op') }}
          </button>
          <button type="button" class="inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors duration-150 ease-out" :class="descending ? 'border-primary/40 bg-primary/15 text-primary' : 'border-line text-body hover:bg-ghost-hover hover:text-primary'" @click="go({ order: descending ? null : 'desc', page: null })">
            <ArrowDownWideNarrow :size="13" />{{ t('discussions.topic.newest_first') }}
          </button>
          <form class="flex items-center gap-1 text-xs text-meta" @submit.prevent="jumpToFloor">
            <label :for="`jump-${topic.id}`">{{ t('discussions.topic.jump') }}</label>
            <input :id="`jump-${topic.id}`" v-model="jump" inputmode="numeric" pattern="[0-9]*" class="input input-sm w-16 px-2 text-center text-xs" placeholder="#">
          </form>
          <CommonPagination v-if="pagination && pagination.last_page > 1" class="ml-auto" :page="pagination.current_page" :total-pages="pagination.last_page" :disabled="pending" @update:page="value => go({ page: value > 1 ? value : null })" />
        </div>

        <div class="mt-4 space-y-3" :class="pending ? 'opacity-60' : ''">
          <DiscussionFloor
            v-for="floor in floors" :key="floor.id" :post="floor"
            :reply-page="data?.focus?.parent_id === floor.id ? data.focus.reply_page : null"
            @update="replacePost"
          />
        </div>

        <button v-if="newActivity" type="button" class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 py-2.5 text-sm font-medium text-primary transition-colors duration-150 ease-out hover:bg-primary/15" @click="showNew">
          <RefreshCw :size="14" />{{ t('discussions.topic.new_replies', { count: newCount }) }}
        </button>

        <div v-if="pagination && pagination.last_page > 1" class="mt-5 flex justify-center">
          <CommonPagination :page="pagination.current_page" :total-pages="pagination.last_page" :disabled="pending" @update:page="value => go({ page: value > 1 ? value : null })" />
        </div>

        <section ref="composerSection" class="card mt-6 scroll-mt-24 p-4 sm:p-5">
          <template v-if="topic.viewer.can.reply">
            <h2 class="mb-3 text-sm font-semibold text-title">{{ t('discussions.composer.title') }}</h2>
            <DiscussionComposer ref="composer" :topic-id="topic.id" @posted="posted" />
          </template>
          <p v-else-if="!isAuthenticated" class="text-center text-sm text-meta">
            <NuxtLink :to="{ path: '/auth/login', query: { redirect: route.fullPath } }" class="link font-medium">{{ t('discussions.composer.login') }}</NuxtLink>
          </p>
          <p v-else class="flex items-center justify-center gap-1.5 text-sm text-meta"><Lock :size="14" />{{ topic.locked ? t('discussions.composer.locked') : t('discussions.composer.closed') }}</p>
          <p v-if="topic.viewer.can.delete && topic.replies_count === 0" class="mt-3 text-right text-xs">
            <button type="button" class="text-danger hover:underline" @click="confirmDeleteTopic = true">{{ t('discussions.topic.delete') }}</button>
          </p>
        </section>
      </template>
      <!-- Also while moving on to the article this topic belongs to. -->
      <SkeletonDiscussionTopic v-else />
    </div>

    <DiscussionReportDialog :post-id="reportPostId" @close="reportPostId = null" />
    <DiscussionModerationDialog :post="moderating" @close="moderating = null" @updated="replacePost" @removed="removePost" />
    <DiscussionTopicEditDialog :topic="editingTopic" :as-moderator="moderator && editingTopic?.author?.id !== topic?.author?.id" @close="editingTopic = null" @saved="editingTopic = null; refresh()" />
    <DiscussionTopicModDialog :topic="moderatingTopic" @close="moderatingTopic = null" @saved="moderatingTopic = null; refresh()" @deleted="moderatingTopic = null; leaveDeletedTopic()" />
    <CommonConfirmDialog v-model="confirmDeleteTopic" :title="t('discussions.topic.delete_title')" :description="t('discussions.topic.delete_help')" @confirm="deleteTopic" />
    <DiscussionNotice />
  </div>
</template>
