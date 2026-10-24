<template>
  <CatalogSection :title="$t('reviews.title')" :icon="MessageSquare">
    <template #actions>
      <span>{{ $t('reviews.count', { count: total }) }}</span>
      <div v-if="total > 1" class="flex items-center gap-1">
        <button
          v-for="option in SORTS"
          :key="option"
          type="button"
          class="chip chip-sm"
          :class="{ 'chip-selected': sort === option }"
          @click="sort = option"
        >{{ $t(`reviews.sort.${option}`) }}</button>
      </div>
    </template>

    <div class="border-b border-line px-5 py-4">
      <template v-if="isAuthenticated">
        <div v-if="mine" class="rounded-lg bg-primary/10 px-3 py-2.5">
          <p class="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-primary">
            {{ $t('reviews.mine') }}
            <span v-if="mine.rating" class="rounded-full px-2 py-0.5 text-[11px] font-medium ring-1" :class="reviewRatingTone(mine.rating)">{{ $t(reviewRatingKey(mine.rating)) }}</span>
            <span v-if="mine.is_hidden" class="rounded bg-btn px-1.5 py-0.5 text-[10px] font-medium text-btn-content">{{ $t('reviews.hidden') }}</span>
          </p>
          <RichContent :content="mine.content" format="markdown" class="text-sm" />
          <div class="mt-1.5 flex gap-3 text-[11px] text-meta">
            <button type="button" class="link link-muted" @click="openEditor">{{ $t('common.edit') }}</button>
            <button type="button" class="link text-danger hover:bg-danger/10" @click="remove">{{ $t('common.delete') }}</button>
          </div>
        </div>
        <div v-else class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-primary btn-sm gap-1.5" @click="openEditor"><PenLine :size="14" />{{ $t('reviews.write') }}</button>
          <span class="text-xs text-meta">{{ $t('reviews.rating_hint') }}</span>
        </div>
      </template>
      <p v-else class="text-sm text-meta">
        <NuxtLink :to="loginPath" class="link">{{ $t('reviews.login') }}</NuxtLink>
      </p>
    </div>

    <ul v-if="reviews.length" class="divide-y divide-line">
      <li v-for="review in reviews" :key="review.id" class="flex gap-3 px-5 py-4">
        <NuxtLink :to="`/profile/${review.user?.username}`" class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sunken">
          <img v-if="review.user?.avatar_url" :src="review.user.avatar_url" :alt="review.user.nickname" class="h-full w-full object-cover">
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <NuxtLink :to="`/profile/${review.user?.username}`" class="font-semibold text-body transition-colors hover:text-primary">{{ review.user?.nickname || review.user?.username }}</NuxtLink>
            <span v-if="review.rating" class="rounded-full px-2 py-0.5 text-[11px] font-medium ring-1" :class="reviewRatingTone(review.rating)">{{ $t(reviewRatingKey(review.rating)) }}</span>
            <span v-if="review.tracking_status" class="rounded bg-btn px-1.5 py-0.5 text-[10px] text-btn-content">{{ $t(`album.stats.${review.tracking_status}`) }}</span>
            <time class="text-meta" :datetime="review.created_at" :title="exact(review.created_at)">{{ ago(review.created_at) }}</time>
            <button
              v-if="isAuthenticated && review.user_id !== user?.id"
              type="button"
              class="ml-auto text-faint transition-colors hover:text-meta"
              :title="$t('reviews.report')"
              @click="reporting = review"
            ><Flag :size="12" /></button>
          </p>

          <div class="relative mt-1" :class="{ 'max-h-56 overflow-hidden': isLong(review) && !expanded.has(review.id) }">
            <RichContent :content="review.content" format="markdown" class="text-sm" />
            <div v-if="isLong(review) && !expanded.has(review.id)" class="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-card" />
          </div>
          <button v-if="isLong(review)" type="button" class="mt-1 text-xs font-medium text-meta transition-colors hover:text-primary" @click="toggleExpanded(review.id)">
            {{ $t(expanded.has(review.id) ? 'reviews.collapse' : 'reviews.expand') }}
          </button>

          <div class="mt-2 flex flex-wrap items-center gap-1">
            <button
              v-for="reaction in REACTIONS"
              :key="reaction.type"
              type="button"
              class="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors disabled:cursor-default disabled:opacity-60"
              :class="review.my_reactions.includes(reaction.type) ? reaction.active : 'text-meta hover:bg-ghost-hover hover:text-primary'"
              :disabled="review.user_id === user?.id || reacting === review.id"
              :aria-pressed="review.my_reactions.includes(reaction.type)"
              @click="react(review, reaction.type)"
            >
              <component :is="reaction.icon" :size="12" />
              <span>{{ $t(`reviews.reactions.${reaction.type}`) }}</span>
              <span v-if="review[`${reaction.type}_count`] > 0" class="tabular-nums">{{ review[`${reaction.type}_count`] }}</span>
            </button>
          </div>
        </div>
      </li>
    </ul>
    <SkeletonStatus v-else-if="pending" class="divide-y divide-line">
      <div v-for="row in 2" :key="row" class="flex gap-3 px-5 py-4">
        <div class="skeleton size-9 shrink-0 rounded-full" />
        <div class="flex-1 space-y-2 pt-0.5">
          <div class="skeleton h-2.5 w-28 rounded-full" />
          <div class="skeleton h-3 rounded-full" :class="row === 1 ? 'w-3/4' : 'w-1/2'" />
        </div>
      </div>
    </SkeletonStatus>
    <p v-else class="px-5 py-6 text-center text-sm text-meta">{{ $t('reviews.empty') }}</p>

    <div v-if="page < lastPage" class="border-t border-line px-5 py-2 text-center">
      <button type="button" class="btn btn-ghost btn-xs" :disabled="pending" @click="load(page + 1)">{{ $t('reviews.more') }}</button>
    </div>
  </CatalogSection>

  <ReviewEditorModal
    v-if="editorOpen"
    :album-id="albumId"
    :review="mine"
    @close="editorOpen = false"
    @saved="onSaved"
  />

  <dialog class="modal" :open="!!reporting">
    <div class="modal-box max-w-sm">
      <h3 class="mb-3 font-bold text-title">{{ $t('reviews.report') }}</h3>
      <UiSelect v-model="reportReason" :options="reportReasonOptions" size="sm" class="mb-2 w-full" />
      <textarea v-model="reportNote" rows="2" class="textarea w-full text-sm" :placeholder="$t('shouts.report_note')" />
      <div class="modal-action">
        <button type="button" class="btn btn-ghost btn-sm" @click="reporting = null">{{ $t('common.cancel') }}</button>
        <button type="button" class="btn btn-sm btn-error" @click="report">{{ $t('reviews.report') }}</button>
      </div>
    </div>
    <div class="modal-backdrop" @click="reporting = null" />
  </dialog>
  <CommonToast :toast="toast" />
</template>

<script setup lang="ts">
import type { AlbumReview, ReactionType, ReviewPage, ReviewSort } from '~/types/reviews'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { Flag, Laugh, MessageSquare, PenLine, ThumbsDown, ThumbsUp } from '@lucide/vue'

/** 评价 on an album page: the viewer's own on top, then everyone else's. See docs/api/reviews.md. */
const props = defineProps<{ albumId: number }>()
const emit = defineEmits<{ changed: [] }>()

const SORTS: ReviewSort[] = ['latest', 'useful']
const REACTIONS = [
  { type: 'useful', icon: ThumbsUp, active: 'bg-blue-50 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300' },
  { type: 'dislike', icon: ThumbsDown, active: 'bg-red-50 text-red-500 dark:bg-red-400/15 dark:text-red-300' },
  { type: 'fun', icon: Laugh, active: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300' },
] as const
const REPORT_REASONS = ['spam', 'abuse', 'spoiler', 'off_topic', 'infringement', 'illegal', 'other'] as const

const { $api } = useNuxtApp()
const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, user } = useAuth()
const { ago, exact } = useRelativeTime()
const { localizeError } = useLocalizedApiError()
const { toast, showToast } = useToast()
const loginPath = computed(() => `/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)

const reviews = ref<AlbumReview[]>([])
const mine = ref<AlbumReview | null>(null)
const total = ref(0)
const page = ref(1)
const lastPage = ref(1)
const sort = ref<ReviewSort>('latest')
// True until the first page is in, so the empty note doesn't flash first.
const pending = ref(true)

const load = async (at = 1) => {
  pending.value = true
  try {
    const result = await $api<ReviewPage>(`/v1/albums/${props.albumId}/reviews`, { params: { page: at, sort: sort.value } })
    reviews.value = at === 1 ? result.reviews : [...reviews.value, ...result.reviews]
    mine.value = result.mine
    total.value = result.pagination.total
    page.value = result.pagination.current_page
    lastPage.value = result.pagination.last_page
  } finally {
    pending.value = false
  }
}
watch(sort, () => load())
// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) load()
else onMounted(() => load())

const expanded = ref(new Set<number>())
const isLong = (review: AlbumReview) => review.content.length > 600 || review.content.split('\n').length > 12
const toggleExpanded = (id: number) => {
  const next = new Set(expanded.value)
  if (!next.delete(id)) next.add(id)
  expanded.value = next
}

const editorOpen = ref(false)
/** Opens the editor on the viewer's review, or sends a guest to log in. */
const openEditor = () => {
  if (!isAuthenticated.value) {
    navigateTo(loginPath.value)
    return
  }
  editorOpen.value = true
}
defineExpose({ openEditor })

const onSaved = async () => {
  editorOpen.value = false
  await load()
  emit('changed')
}

const remove = async () => {
  if (!mine.value || !confirm(t('reviews.delete_confirm'))) return
  try {
    await $api(`/v1/reviews/${mine.value.id}`, { method: 'DELETE' })
    await load()
    emit('changed')
  } catch (error) {
    showToast(localizeError(error), 'error')
  }
}

const reacting = ref<number | null>(null)
const react = async (review: AlbumReview, type: ReactionType) => {
  if (!isAuthenticated.value) {
    navigateTo(loginPath.value)
    return
  }
  const on = !review.my_reactions.includes(type)
  reacting.value = review.id
  try {
    const counts = await $api<Pick<AlbumReview, 'useful_count' | 'dislike_count' | 'fun_count'>>(`/v1/reviews/${review.id}/reactions/${type}`, { method: on ? 'PUT' : 'DELETE' })
    Object.assign(review, {
      useful_count: counts.useful_count, dislike_count: counts.dislike_count, fun_count: counts.fun_count,
      my_reactions: on ? [...review.my_reactions, type] : review.my_reactions.filter(r => r !== type),
    })
  } catch (error) {
    showToast(localizeError(error), 'error')
  } finally {
    reacting.value = null
  }
}

const reporting = ref<AlbumReview | null>(null)
const reportReason = ref<typeof REPORT_REASONS[number]>('spam')
const reportReasonOptions = computed<UiSelectOption<typeof REPORT_REASONS[number]>[]>(() => REPORT_REASONS.map(reason => ({ value: reason, label: t(`shouts.reasons.${reason}`) })))
const reportNote = ref('')
const report = async () => {
  if (!reporting.value) return
  try {
    await $api(`/v1/reviews/${reporting.value.id}/reports`, { method: 'POST', body: { reason: reportReason.value, note: reportNote.value || null } })
    showToast(t('reviews.reported'))
  } catch (error) {
    showToast(localizeError(error), 'error')
  } finally {
    reporting.value = null
    reportNote.value = ''
  }
}
</script>
