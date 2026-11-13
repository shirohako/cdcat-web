<template>
  <!-- A page's share card, to look at and download at 1800×945 (docs/share-cards in the API repo). A style the
       backend has not drawn yet is drawn when first asked for: the request is repeated until it is ready. -->
  <UiDialog v-model="open" :title="title" :description="$t('share_card.description')" :icon="ImageDown" size="lg">
    <div class="flex flex-col gap-4 pb-1">
      <div class="relative aspect-[1200/630] w-full overflow-hidden rounded-lg bg-sunken ring-1 ring-line">
        <img
          v-if="current?.status === 'ready'"
          :key="current.image_url"
          v-img-fade
          :src="current.image_url"
          :alt="title"
          class="size-full object-cover"
        >
        <div v-else-if="current?.status === 'failed'" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-meta">
          {{ $t('share_card.failed') }}
          <UiButton size="sm" @click="request(selected)">{{ $t('common.retry') }}</UiButton>
        </div>
        <div v-else class="skeleton absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-meta">
          <UiSpinner size="md" />
          <span>{{ $t('share_card.drawing') }}</span>
          <span class="text-xs text-faint">{{ $t('share_card.drawing_hint') }}</span>
        </div>
      </div>

      <div v-if="styles.length > 1" class="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" :aria-label="title">
        <button
          v-for="style in styles"
          :key="style"
          type="button"
          role="radio"
          :aria-checked="style === selected"
          class="group flex min-w-0 flex-col gap-1.5 rounded-lg text-left text-xs"
          @click="select(style)"
        >
          <img
            :src="`/images/share-cards/${style}.webp`"
            alt=""
            class="aspect-[1200/630] w-full rounded-md object-cover transition-shadow duration-150"
            :class="style === selected ? 'ring-2 ring-primary' : 'ring-1 ring-line group-hover:ring-title/30'"
          >
          <span :class="style === selected ? 'font-semibold text-title' : 'text-body'">{{ $t(`share_card.styles.${style}`) }}</span>
          <span v-if="style === previewStyle" class="-mt-1 text-[11px] text-meta">{{ $t('share_card.preview_style') }}</span>
        </button>
      </div>
    </div>

    <template #footer>
      <span class="mr-auto text-xs text-meta">{{ $t('share_card.format') }}</span>
      <UiButton @click="open = false">{{ $t('common.cancel') }}</UiButton>
      <UiButton
        variant="primary"
        :icon="Download"
        :href="current?.status === 'ready' ? current.download_url : undefined"
        :disabled="current?.status !== 'ready'"
      >
        {{ $t('share_card.download') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { Download, ImageDown } from '@lucide/vue'

const props = withDefaults(defineProps<{
  /** POST {endpoint}/{style}, or POST {endpoint} for a page with one card (a profile). */
  endpoint: string
  title: string
  /** The page's styles, in the order shown; one or none: no picker. */
  styles?: string[]
  /** Selected when the dialog opens: the link preview's style. */
  previewStyle?: string
}>(), { styles: () => [], previewStyle: undefined })

const open = defineModel<boolean>({ required: true })

const { states, request, stop } = useShareCardDownload(style => (style && props.styles.length ? `${props.endpoint}/${style}` : props.endpoint))
const selected = ref(props.previewStyle ?? props.styles[0] ?? '')
const current = computed(() => states[selected.value])

function select(style: string) {
  selected.value = style
  if (states[style]?.status !== 'ready') request(style)
}

watch(open, (value) => {
  if (value) {
    if (states[selected.value]?.status !== 'ready') request(selected.value)
  } else {
    stop()
  }
}, { immediate: true })
</script>
