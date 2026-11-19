<template>
  <!-- A page's share card, to look at, download at 1800×945 or share (docs/share-cards in the API repo). A style the
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

      <div v-if="styles.length > 1" class="grid gap-3" :class="styles.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'" role="radiogroup" :aria-label="title">
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

      <!-- The page's address in the sharer's language. Whoever opens it sees the link preview's card, whichever style
           is picked above; the picked style goes out as a picture (复制图片, or 更多… with the system's share sheet).
           The same buttons everywhere; only QQ's differs on phones (see opensPage). -->
      <div class="flex flex-col gap-2 border-t border-line pt-4">
        <div class="flex items-baseline justify-between gap-3 text-xs text-meta">
          <span>{{ $t('share_card.link') }}</span>
          <span v-if="previewStyle && styles.length > 1">{{ $t('share_card.link_preview', { style: $t(`share_card.styles.${previewStyle}`) }) }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UiInput
            ref="linkInput"
            :model-value="page.url"
            :icon="Link"
            readonly
            :aria-label="$t('share_card.link')"
            class="min-w-48 flex-1"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <UiButton :icon="Copy" @click="copyLink()">{{ $t('share_card.copy') }}</UiButton>
          <UiButton
            v-for="site in SITES"
            :key="site.key"
            variant="outline"
            :label="$t('share_card.share_to', { site: site.name })"
            v-bind="opensPage(site.key) ? { href: shareUrl(site.key as ShareSite, page), target: '_blank', rel: 'noopener noreferrer' } : {}"
            @click="press(site.key)"
          >
            <Icon :name="site.icon" class="size-[18px]" :class="site.color" />
          </UiButton>
          <!-- The system's share sheet, where there is one: every app on the phone, and the picked style as a file. -->
          <UiButton v-if="canShare" :icon="Share2" :loading="fileLoading" @click="shareNatively">{{ $t('share_card.more') }}</UiButton>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="mr-auto text-xs text-meta">{{ $t('share_card.format', { size }) }}</span>
      <UiButton v-if="canCopyImage" :icon="ImageIcon" :loading="copyingImage" :disabled="!ready" @click="copyImage">
        {{ $t('share_card.copy_image') }}
      </UiButton>
      <UiButton variant="primary" :icon="Download" :href="ready ? current?.download_url : undefined" :disabled="!ready">
        {{ $t('share_card.download') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { Copy, Download, Image as ImageIcon, ImageDown, Link, Share2 } from '@lucide/vue'
import { shareUrl, type SharePage, type ShareSite } from '~/utils/shareTargets'
import { languageUrl, type SiteLocale } from '~~/shared/utils/languageUrls'

const props = withDefaults(defineProps<{
  /** POST {endpoint}/{style}, or POST {endpoint} for a page with one card (a profile). */
  endpoint: string
  title: string
  /** The page's styles, in the order shown; one or none: no picker. */
  styles?: string[]
  /** Selected when the dialog opens: the link preview's style. */
  previewStyle?: string
  /** The downloads' size: album cards are drawn at 1800×945, artist cards (all drawn ahead of time) at 1200×630. */
  size?: string
  /** A square picture of the page (the cover, the avatar), for QQ's small square thumbnail. */
  cover?: string | null
}>(), { styles: () => [], previewStyle: undefined, size: '1800×945', cover: null })

const open = defineModel<boolean>({ required: true })

/** The sites' buttons, in the order shown. */
const SITES: Array<{ key: ShareSite | 'discord', name: string, icon: string, color: string }> = [
  { key: 'x', name: 'X', icon: 'simple-icons:x', color: 'text-title' },
  { key: 'line', name: 'LINE', icon: 'simple-icons:line', color: 'text-[#06c755]' },
  { key: 'qq', name: 'QQ', icon: 'simple-icons:qq', color: 'text-[#12b7f5]' },
  { key: 'discord', name: 'Discord', icon: 'simple-icons:discord', color: 'text-[#5865f2]' },
]

/** The buttons that copy the link instead of opening a share page, each with its own hint. */
type CopiedFor = 'discord' | 'qq'

const { t, locale } = useI18n()
const route = useRoute()
const absolute = useSiteUrl()
const { showToast } = useToast()

const { states, request, stop } = useShareCardDownload(style => (style && props.styles.length ? `${props.endpoint}/${style}` : props.endpoint))
const selected = ref(props.previewStyle ?? props.styles[0] ?? '')
const current = computed(() => states[selected.value])
const ready = computed(() => current.value?.status === 'ready')

function select(style: string) {
  selected.value = style
  if (states[style]?.status !== 'ready') request(style)
}

/** What the browser can do, known only there, which is where the dialog opens. */
const mobile = ref(false)
const canShare = ref(false)
const canCopyImage = ref(false)
onMounted(() => {
  mobile.value = window.matchMedia('(pointer: coarse)').matches
  canShare.value = typeof navigator.share === 'function'
  canCopyImage.value = typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function'
})

/**
 * Whether a site's button opens its share page. Discord has none: the link is copied, and pasted in a chat it unfolds
 * into the card. QQ's page offers PC QQ or a code to scan with mobile QQ, which a phone can't do with its own screen,
 * so on phones the link is copied for pasting in QQ.
 */
function opensPage(key: ShareSite | 'discord') {
  return key !== 'discord' && !(key === 'qq' && mobile.value)
}

/** A button that opens a page is a link and needs nothing more; the others copy. */
function press(key: ShareSite | 'discord') {
  if (!opensPage(key)) copyLink(key as CopiedFor)
}

/** The page as it is shared: its address in the sharer's language, and what it tells crawlers it is. */
const page = ref<SharePage>({ url: '', title: '' })
function readPage() {
  const meta = (property: string) => document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content || null
  const path = route.path.replace(/(?!^)\/+$/, '')
  page.value = {
    url: absolute(languageUrl(path, locale.value as SiteLocale)),
    title: meta('og:title') ?? document.title,
    description: meta('og:description'),
    image: props.cover ? absolute(props.cover) : null,
  }
}

const linkInput = useTemplateRef<{ $el: HTMLElement }>('linkInput')
async function copyLink(site?: CopiedFor) {
  try {
    await navigator.clipboard.writeText(page.value.url)
    showToast(t(site ? `share_card.${site}_copied` : 'share_card.link_copied'))
  } catch {
    // Selected, so a copy by hand is one keystroke away. With its icon, UiInput's root is a wrapper around the input.
    linkInput.value?.$el.querySelector('input')?.select()
    showToast(t('share_card.copy_failed'), 'error')
  }
}

/** The drawn card's file, fetched once per address. The API sends it with CORS, unlike the storage host. */
const blobs = new Map<string, Promise<Blob>>()
function cardBlob(address: string) {
  let blob = blobs.get(address)
  if (!blob) {
    blob = fetch(address).then((response) => {
      if (!response.ok) throw new Error(`share card ${response.status}`)
      return response.blob()
    })
    blob.catch(() => blobs.delete(address))
    blobs.set(address, blob)
  }
  return blob
}

/** The clipboard takes PNG only. */
async function toPng(blob: Blob) {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  bitmap.close()
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(png => (png ? resolve(png) : reject(new Error('png'))), 'image/png'))
}

const copyingImage = ref(false)
async function copyImage() {
  const address = current.value?.download_url
  if (!address) return
  copyingImage.value = true
  try {
    // The item is made in the click with the picture still to come, which Safari needs to allow the write.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': cardBlob(address).then(toPng) })])
    showToast(t('share_card.image_copied'))
  } catch {
    showToast(t('share_card.image_copy_failed'), 'error')
  } finally {
    copyingImage.value = false
  }
}

/**
 * The picked style as a file, fetched as soon as it is drawn: the share sheet has to open in the tap itself, and a
 * download in between would use up the tap.
 */
const file = ref<File | null>(null)
const fileLoading = ref(false)
watch([canShare, () => current.value?.download_url, open], async ([sharing, address, isOpen]) => {
  file.value = null
  fileLoading.value = false
  if (!sharing || !address || !isOpen) return
  const style = selected.value
  fileLoading.value = true
  try {
    const blob = await cardBlob(address)
    if (current.value?.download_url !== address) return
    const name = `cdcat-${route.path.split('/').filter(Boolean).join('-')}${style ? `-${style}` : ''}.jpg`
    file.value = new File([blob], name, { type: blob.type || 'image/jpeg' })
  } catch {
    // Without the file, the sheet sends the link alone.
  } finally {
    if (current.value?.download_url === address) fileLoading.value = false
  }
}, { immediate: true })

async function shareNatively() {
  const data: ShareData = { title: page.value.title, url: page.value.url }
  if (file.value && navigator.canShare?.({ files: [file.value] })) data.files = [file.value]
  try {
    await navigator.share(data)
  } catch (error) {
    if ((error as DOMException).name !== 'AbortError') showToast(t('share_card.share_failed'), 'error')
  }
}

watch(open, (value) => {
  if (value) {
    readPage()
    if (states[selected.value]?.status !== 'ready') request(selected.value)
  } else {
    stop()
  }
}, { immediate: true })
</script>
