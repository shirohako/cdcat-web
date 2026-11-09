<script setup lang="ts">
import type { AlbumDisc, AlbumDiscToc } from '~/types/album'

/**
 * The album's CD tables of contents and their disc ids: CDCat's own first, then freedb, MusicBrainz, AccurateRip and
 * the CUETools database, all alike and each copyable, over the TOC as EAC prints it. A disc can have one TOC per
 * pressing. Opened from AlbumEditing; `discs` are the discs that have a TOC.
 */
const props = defineProps<{ discs: AlbumDisc[] }>()
const open = defineModel<boolean>({ required: true })

const { t, te } = useI18n()
const { showToast } = useToast()
const { onClick: onExternalClick } = useExternalLink()

const current = ref(props.discs[0]?.id ?? 0)
watch(() => props.discs, (discs) => {
  if (!discs.some(disc => disc.id === current.value)) current.value = discs[0]?.id ?? 0
})
const disc = computed(() => props.discs.find(item => item.id === current.value) ?? props.discs[0])
const discItems = computed(() => props.discs.map(item => ({ value: item.id, label: t('catalog.toc.disc_n', { n: item.position }) })))

const ids = (toc: AlbumDiscToc) => [
  { key: 'cdcat', label: 'CDCat Disc ID', value: toc.cdcat_id },
  { key: 'freedb', label: 'freedb (CDDB)', value: toc.freedb_id },
  { key: 'musicbrainz', label: 'MusicBrainz Disc ID', value: toc.mb_discid, href: `https://musicbrainz.org/cdtoc/${toc.mb_discid}` },
  { key: 'accuraterip', label: 'AccurateRip ID', value: toc.accuraterip_id },
  { key: 'ctdb', label: 'CTDB TOC ID', value: toc.ctdb_id },
]
const sourceLabel = (source: string) => te(`catalog.toc.source.${source}`) ? t(`catalog.toc.source.${source}`) : source

const copied = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
async function copy(key: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = key
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = null }, 1500)
  }
  catch {
    showToast(t('album.toc.copy_failed'), 'error')
  }
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <UiDialog v-model="open" size="lg" :title="t('album.toc.title')" :description="t('album.toc.description')">
    <UiSegmented v-if="discs.length > 1" v-model="current" :items="discItems" size="sm" :label="t('album.toc.disc_picker')" class="mb-4" />
    <div v-if="disc" class="space-y-6">
      <p v-if="disc.tocs.length > 1" class="text-xs leading-relaxed text-meta">{{ t('album.toc.pressings', { n: disc.tocs.length }) }}</p>
      <section v-for="(toc, index) in disc.tocs" :key="toc.id" class="space-y-3">
        <h3 v-if="disc.tocs.length > 1" class="text-sm font-semibold text-title">{{ t('album.toc.toc_n', { n: index + 1 }) }}</h3>
        <dl class="divide-y divide-line overflow-hidden rounded-lg ring-1 ring-inset ring-line">
          <div v-for="item in ids(toc)" :key="item.key" class="flex items-center gap-3 py-1.5 pl-3 pr-1.5">
            <dt class="w-28 shrink-0 text-xs text-meta sm:w-40">{{ item.label }}</dt>
            <dd class="min-w-0 flex-1 break-all font-mono text-13 leading-5 text-title">{{ item.value }}</dd>
            <UiButton
              v-if="item.href"
              :href="item.href"
              target="_blank"
              rel="noopener"
              icon="lucide:external-link"
              :label="t('album.toc.open_musicbrainz')"
              size="xs"
              @click="onExternalClick($event, { url: item.href!, name: item.label, site: 'MusicBrainz', category: 'database', providerKey: 'musicbrainz' })"
            />
            <UiButton
              :icon="copied === `${toc.id}:${item.key}` ? 'lucide:check' : 'lucide:copy'"
              :label="copied === `${toc.id}:${item.key}` ? t('album.toc.copied') : t('album.toc.copy')"
              size="xs"
              @click="copy(`${toc.id}:${item.key}`, item.value)"
            />
          </div>
        </dl>
        <CatalogTocTable :toc="toc" />
        <p class="text-xs text-meta">{{ t('album.toc.source', { source: sourceLabel(toc.source) }) }}</p>
      </section>
    </div>
  </UiDialog>
</template>
