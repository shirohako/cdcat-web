<template>
  <!-- The member card, always on show in the side column: the link preview this profile shares as, and its download
       (1800×945, drawn by the backend the first time it is asked for). A profile whose card is not drawn yet asks for
       the download right away, so the column never stays empty. -->
  <section class="card animate-fade-in-up-slow p-5">
    <header class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-base font-semibold leading-6 text-title">{{ $t('share_card.button') }}</h2>
    </header>

    <div class="relative aspect-[1200/630] w-full overflow-hidden rounded-lg bg-sunken ring-1 ring-line">
      <img v-if="image" :key="image" v-img-fade :src="image" :alt="$t('share_card.button')" class="size-full object-cover">
      <div v-else-if="state?.status === 'failed'" class="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-meta">
        {{ $t('share_card.failed') }}
      </div>
      <div v-else class="skeleton absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-xs text-meta">
        <UiSpinner />
        {{ $t('share_card.drawing') }}
      </div>
    </div>
    <p class="mt-2.5 text-xs leading-5 text-meta">{{ $t('share_card.description') }}</p>

    <UiButton class="mt-3" block :icon="Download" :loading="downloading" @click="download">
      {{ $t('share_card.download') }}
    </UiButton>
  </section>
</template>

<script setup lang="ts">
import { Download } from '@lucide/vue'

const props = defineProps<{
  username: string
  /** The profile's link preview (share_card_url); null until the backend has drawn it. */
  cardUrl?: string | null
}>()

const { t } = useI18n()
const { showToast } = useToast()
const { states, request } = useShareCardDownload(() => `/v1/profiles/${encodeURIComponent(props.username)}/share-card`)
const state = computed(() => states[''])
const image = computed(() => props.cardUrl || (state.value?.status === 'ready' ? state.value.image_url : undefined))
const downloading = ref(false)

/** Starts the download once the card is drawn: the API sends it as an attachment, so the page stays. */
async function download() {
  downloading.value = true
  const result = state.value?.status === 'ready' ? state.value : await request()
  downloading.value = false
  if (result?.status === 'ready' && result.download_url) {
    window.location.href = result.download_url
  } else {
    showToast(t('share_card.failed'), 'error')
  }
}

onMounted(() => {
  if (!props.cardUrl) request()
})
</script>
