<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

      <div class="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-card text-body shadow-overlay ring-1 ring-line">
        <div class="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <div class="flex items-center gap-2.5">
            <UiIconTile :icon="MessageSquare" />
            <h2 class="text-base font-bold text-title">{{ $t(review ? 'reviews.edit' : 'reviews.write') }}</h2>
          </div>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full text-meta transition-colors hover:bg-black/[0.08] hover:text-primary dark:hover:bg-white/[0.1]" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <!-- Outside an album page, the album being reviewed. -->
          <div v-if="review?.album" class="flex items-center gap-3 rounded-xl bg-sunken p-3">
            <img v-if="review.album.image_url" :src="review.album.image_url" :alt="review.album.title" class="h-12 w-12 rounded-md object-cover">
            <p class="min-w-0 flex-1 truncate text-sm font-semibold text-title">{{ review.album.title }}</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-body">
              {{ $t('reviews.rating') }} <span class="ml-1 text-xs font-normal text-meta">{{ $t('reviews.rating_hint') }}</span>
            </label>
            <!-- After Metacritic's "my score": five parts, pale in their own level's colour; pointing at one fills the
                 bar up to it in that level's colour, a press picks it (again: takes it back). The square and name show
                 the level pointed at, else the picked one; nothing picked, a dash on a faint square and 未评分. -->
            <div class="flex items-center gap-4">
              <div class="-my-1.5 flex min-w-0 flex-1" @pointerleave="pointed = null">
                <button
                  v-for="value in LEVELS"
                  :key="value"
                  type="button"
                  class="box-content flex-1 cursor-pointer py-1.5 focus-visible:outline-none"
                  :class="value > 1 && 'pl-0.5'"
                  :aria-label="$t(reviewRatingKey(value))"
                  :aria-pressed="form.rating === value"
                  @pointerenter="pointed = value"
                  @focus="pointed = value"
                  @blur="pointed = null"
                  @click="form.rating = form.rating === value ? null : value"
                >
                  <span
                    class="block h-2.5 transition-colors duration-150"
                    :class="[
                      shownRating && value <= shownRating ? REVIEW_LEVEL_COLORS[shownRating].solid : REVIEW_LEVEL_COLORS[value].pale,
                      value === 1 && 'rounded-l-full',
                      value === LEVELS.length && 'rounded-r-full',
                    ]"
                  />
                </button>
              </div>
              <div class="flex w-32 shrink-0 items-center gap-2.5">
                <span
                  class="grid size-10 shrink-0 place-items-center rounded-md text-base font-black tabular-nums transition-colors duration-150"
                  :class="shownRating ? REVIEW_LEVEL_COLORS[shownRating].solid : 'bg-black/[0.05] text-faint dark:bg-white/[0.08]'"
                >{{ shownRating ?? '–' }}</span>
                <span class="truncate text-sm font-semibold" :class="shownRating ? 'text-title' : 'text-meta'">{{ shownRating ? $t(reviewRatingKey(shownRating)) : $t('reviews.unrated') }}</span>
              </div>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-body">
              <span class="flex items-center gap-1.5"><Globe :size="13" />{{ $t('reviews.language') }} <span class="text-danger">*</span></span>
            </label>
            <UiSelect v-model="form.language" :options="languageOptions" size="sm" class="w-full max-w-xs" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-body">
              {{ $t('reviews.content') }} <span class="text-danger">*</span>
            </label>
            <MarkdownEditor v-model="form.content" :disabled="submitting" :placeholder="$t('reviews.placeholder')" />
            <div class="mt-1.5 flex justify-end">
              <span class="text-xs tabular-nums" :class="form.content.length > REVIEW_MAX_LENGTH ? 'text-danger' : 'text-meta'">
                {{ form.content.length }} / {{ REVIEW_MAX_LENGTH }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="mx-6 rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-sm text-danger">{{ errorMessage }}</div>

        <div class="flex shrink-0 items-center justify-end gap-2 border-t border-line px-6 py-4">
          <UiButton size="sm" @click="emit('close')">{{ $t('common.cancel') }}</UiButton>
          <UiButton variant="primary" size="sm" :loading="submitting" :disabled="!canSubmit" @click="submit">
            {{ $t(review ? 'reviews.update' : 'reviews.submit') }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { AlbumReview, ReviewDraft, ReviewRating } from '~/types/reviews'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { REVIEW_MAX_LENGTH } from '~/types/reviews'
import { Globe, MessageSquare, X } from '@lucide/vue'

const LANGUAGE_CODES = ['zh-Hans', 'zh-Hant', 'ja', 'en', 'ko', 'fr', 'de', 'es', 'pt', 'ru'] as const

/** Writes the viewer's review of an album, or edits it when `review` is given. */
const props = defineProps<{
  albumId?: number | null
  review?: ReviewDraft | null
}>()

const emit = defineEmits<{
  close: []
  saved: [review: AlbumReview]
}>()

const { $api } = useNuxtApp()
const { locale } = useI18n()
const { languageName } = useLocaleFormatting()
const languageOptions = computed<UiSelectOption<string>[]>(() => LANGUAGE_CODES.map(code => ({ value: code, label: languageName(code) })))
const { localizeError } = useLocalizedApiError()

const defaultLanguage = (LANGUAGE_CODES as readonly string[]).includes(locale.value) ? locale.value : 'zh-Hans'
const form = reactive({
  content: props.review?.content ?? '',
  rating: (props.review?.rating ?? null) as ReviewRating | null,
  language: props.review?.language ?? defaultLanguage,
})

const LEVELS: ReviewRating[] = [1, 2, 3, 4, 5]
/** The level under the pointer (or keyboard focus) in the rating picker */
const pointed = ref<ReviewRating | null>(null)
const shownRating = computed(() => pointed.value ?? form.rating)

const targetAlbumId = computed(() => props.albumId ?? props.review?.album_id ?? null)

const submitting = ref(false)
const errorMessage = ref('')
// The language is required here (the API still takes none, for older clients).
const canSubmit = computed(() => !!targetAlbumId.value && !!form.language && form.content.trim().length > 0 && form.content.length <= REVIEW_MAX_LENGTH)

const submit = async () => {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const saved = await $api<AlbumReview>(`/v1/albums/${targetAlbumId.value}/reviews`, {
      method: 'POST',
      body: { content: form.content.trim(), rating: form.rating, language: form.language },
    })
    emit('saved', saved)
  } catch (error) {
    errorMessage.value = localizeError(error, 'reviews.submit_failed')
  } finally {
    submitting.value = false
  }
}

onMounted(() => { document.body.style.overflow = 'hidden' })
onUnmounted(() => { document.body.style.overflow = '' })
</script>
