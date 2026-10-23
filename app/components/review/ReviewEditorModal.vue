<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

      <div class="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
        <div class="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <MessageSquare :size="15" class="text-amber-500" />
            </div>
            <h2 class="text-base font-bold text-gray-900">{{ $t(review ? 'reviews.edit' : 'reviews.write') }}</h2>
          </div>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100" @click="emit('close')">
            <X :size="18" class="text-gray-400" />
          </button>
        </div>

        <div class="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <!-- Outside an album page, the album being reviewed. -->
          <div v-if="review?.album" class="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <img v-if="review.album.image_url" :src="review.album.image_url" :alt="review.album.title" class="h-12 w-12 rounded-md object-cover">
            <p class="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{{ review.album.title }}</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700">
              {{ $t('reviews.rating') }} <span class="ml-1 text-xs font-normal text-gray-400">{{ $t('reviews.rating_hint') }}</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="value in REVIEW_RATINGS"
                :key="value"
                type="button"
                class="rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors"
                :class="form.rating === value ? reviewRatingTone(value) : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50'"
                :aria-pressed="form.rating === value"
                @click="form.rating = form.rating === value ? null : value"
              >{{ $t(reviewRatingKey(value)) }}</button>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700">
              <span class="flex items-center gap-1.5"><Globe :size="13" />{{ $t('reviews.language') }}</span>
            </label>
            <select v-model="form.language" class="select select-bordered select-sm w-full max-w-xs">
              <option v-for="code in LANGUAGE_CODES" :key="code" :value="code">{{ languageName(code) }}</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700">
              {{ $t('reviews.content') }} <span class="text-red-400">*</span>
            </label>
            <MarkdownEditor v-model="form.content" :disabled="submitting" :placeholder="$t('reviews.placeholder')" />
            <div class="mt-1.5 flex justify-end">
              <span class="text-xs tabular-nums" :class="form.content.length > REVIEW_MAX_LENGTH ? 'text-red-500' : 'text-gray-400'">
                {{ form.content.length }} / {{ REVIEW_MAX_LENGTH }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="mx-6 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">{{ errorMessage }}</div>

        <div class="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" class="btn btn-ghost btn-sm" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button type="button" class="btn btn-neutral btn-sm gap-1.5" :disabled="!canSubmit || submitting" @click="submit">
            <Loader2 v-if="submitting" :size="14" class="animate-spin" />
            {{ $t(review ? 'reviews.update' : 'reviews.submit') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { AlbumReview, ReviewDraft, ReviewRating } from '~/types/reviews'
import { REVIEW_MAX_LENGTH } from '~/types/reviews'
import { Globe, Loader2, MessageSquare, X } from '@lucide/vue'

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
const { localizeError } = useLocalizedApiError()

const defaultLanguage = (LANGUAGE_CODES as readonly string[]).includes(locale.value) ? locale.value : 'zh-Hans'
const form = reactive({
  content: props.review?.content ?? '',
  rating: (props.review?.rating ?? null) as ReviewRating | null,
  language: props.review?.language ?? defaultLanguage,
})

const targetAlbumId = computed(() => props.albumId ?? props.review?.album_id ?? null)

const submitting = ref(false)
const errorMessage = ref('')
const canSubmit = computed(() => !!targetAlbumId.value && form.content.trim().length > 0 && form.content.length <= REVIEW_MAX_LENGTH)

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
