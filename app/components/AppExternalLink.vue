<template>
  <UiDialog
    :model-value="!!shown"
    topmost
    size="md"
    :title="t('external_link.title')"
    icon="lucide:external-link"
    @update:model-value="(open) => { if (!open) closeExternalLink() }"
  >
    <!-- What the link is, row by row; the address as written, its host standing out so a look-alike domain shows. -->
    <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 text-sm leading-6">
      <dt class="text-meta">{{ t('external_link.type') }}</dt>
      <dd class="flex min-w-0 items-center gap-2 font-medium text-title">
        <CatalogLinkTile :category="kept.category" :provider-key="kept.providerKey" />
        {{ t(`catalog.link_category.${linkCategoryKey(kept.category)}`) }}
      </dd>
      <dt class="text-meta">{{ t('external_link.site') }}</dt>
      <dd class="min-w-0 font-medium text-title wrap-break-word">{{ site }}</dd>
      <template v-if="name">
        <dt class="text-meta">{{ t('external_link.name') }}</dt>
        <dd class="min-w-0 font-medium text-title wrap-break-word">{{ name }}</dd>
      </template>
      <dt class="text-meta">{{ t('external_link.url') }}</dt>
      <dd class="min-w-0 break-all pt-0.5 font-mono text-13 leading-5 text-meta"><span class="text-faint">{{ address.scheme }}</span><span class="font-semibold text-title">{{ address.host }}</span>{{ address.rest }}</dd>
    </dl>

    <UiAlert tone="warning" :title="t('external_link.leaving_title')" class="mt-4">
      {{ t('external_link.leaving_text') }}
    </UiAlert>

    <template #footer>
      <UiButton size="sm" :icon="copied ? 'lucide:check' : 'lucide:copy'" @click="copy">
        {{ copied ? t('external_link.copied') : t('external_link.copy') }}
      </UiButton>
      <UiButton
        v-if="isWebAddress(kept.url)"
        variant="primary"
        size="sm"
        :href="kept.url"
        target="_blank"
        rel="noopener noreferrer"
        icon-right="lucide:external-link"
        data-autofocus
        @click="closeExternalLink()"
      >
        {{ t('external_link.open') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { ExternalLinkInfo } from '~/composables/useExternalLink'
import { linkCategoryKey, linkHost, splitUrl } from '~/utils/linkProviders'

/**
 * The external link card behind useExternalLink(), mounted once in app.vue: the link's type, site, own name and full
 * address, a friendly reminder that it leaves CDCat, and buttons to copy or open it. It sits above every other layer,
 * as drawers, popovers and dialogs can open it.
 */
const { t } = useI18n()
const { showToast } = useToast()
const { shown } = useExternalLink()

// Kept after the card closes, so the text doesn't vanish while it fades out.
const kept = shallowRef<ExternalLinkInfo>({ url: '' })
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(shown, (value) => {
  if (!value) return
  kept.value = value
  copied.value = false
  clearTimeout(timer)
})

const site = computed(() => kept.value.site?.trim() || linkHost(kept.value.url))
/** The link's own name, unless it only repeats the site's. */
const name = computed(() => {
  const own = kept.value.name?.trim()
  return own && own !== site.value ? own : ''
})
const address = computed(() => splitUrl(kept.value.url))

async function copy() {
  try {
    await navigator.clipboard.writeText(kept.value.url)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = false }, 1500)
  } catch {
    showToast(t('external_link.copy_failed'), 'error')
  }
}

// Escape closes only the card: caught first, so a drawer or dialog underneath doesn't close on the same key.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !event.isComposing && shown.value) {
    event.stopImmediatePropagation()
    closeExternalLink()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown, true)
  clearTimeout(timer)
})
</script>
