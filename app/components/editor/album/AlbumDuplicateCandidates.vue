<template>
  <section
    v-if="candidates.length"
    ref="root"
    class="rounded-xl border p-4"
    :class="strong.length ? 'border-warning/25 bg-warning/10' : 'border-transparent bg-card'"
  >
    <p class="flex items-center gap-2 text-sm font-semibold" :class="strong.length ? 'text-warning' : 'text-title'">
      <CopyCheck :size="16" class="shrink-0" />{{ $t('duplicates.title') }}
    </p>
    <p class="mt-1 text-xs" :class="strong.length ? 'text-body' : 'text-meta'">{{ $t(strong.length ? 'duplicates.strong_hint' : 'duplicates.weak_hint') }}</p>
    <ul class="mt-3 space-y-2">
      <li v-for="candidate in candidates" :key="candidate.album_id" class="flex items-center gap-3 rounded-lg p-2" :class="strong.length ? 'bg-card' : 'bg-sunken'">
        <img v-if="candidate.album.image_url" :src="candidate.album.image_url" alt="" class="h-11 w-11 shrink-0 rounded object-cover">
        <span v-else class="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-btn text-faint"><Disc3 :size="18" /></span>
        <div class="min-w-0 flex-1">
          <a :href="`/albums/${candidate.album.id}`" target="_blank" rel="noopener" class="flex min-w-0 items-center gap-1.5 text-sm font-medium text-title transition-colors hover:text-primary">
            <span class="truncate">{{ candidate.album.title }}</span>
            <CatalogPendingBadge v-if="candidate.album.is_pending" />
          </a>
          <p class="truncate text-xs text-meta">
            {{ [candidate.album.catalog_number, formatDate(candidate.album.release_date, candidate.album.release_date_precision as DatePrecision | null)].filter(Boolean).join(' · ') }}
          </p>
          <p class="truncate text-[11px]" :class="candidate.strength === 'strong' ? 'text-warning' : 'text-meta'">
            {{ candidate.reasons.map(reason => $t(`duplicates.reasons.${reason.kind}`, { value: reason.value })).join('；') }}
          </p>
        </div>
        <label v-if="candidate.strength === 'strong'" class="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-body">
          <input type="checkbox" class="checkbox checkbox-xs" :checked="acknowledged.includes(candidate.album_id)" @change="acknowledge(candidate.album_id, ($event.target as HTMLInputElement).checked)">
          {{ $t('duplicates.not_same') }}
        </label>
      </li>
    </ul>
    <p v-if="unconfirmed" class="mt-2 text-xs font-medium text-warning">{{ $t('duplicates.must_confirm') }}</p>
  </section>
  <p v-else-if="checking" class="text-xs text-meta">{{ $t('duplicates.checking') }}</p>
</template>

<script setup lang="ts">
// Possible duplicates of a new album while it is entered (docs/catalog/editing.md#新建专辑查重):
// albums, pending ones included, that share a catalog number, a barcode or an external link (strong),
// or only the title (weak). Strong ones must be ticked as different before the album can be submitted;
// the ticks go into the album item's acknowledged_duplicate_ids.
import type { DatePrecision } from '~/types/entry'
import type { DuplicateCandidate } from '~/types/revision'
import { CopyCheck, Disc3 } from '@lucide/vue'
import { pruneAlbumDocument } from '~/utils/albumDocument'

const { album, draft, mainRef, albumId } = useAlbumEditor()
const { $api } = useNuxtApp()
const { formatDate } = useCatalogDisplay()

const candidates = ref<DuplicateCandidate[]>([])
const checking = ref(false)
const root = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

const item = computed(() => draft.items.value.find(entry => entry.ref === mainRef.value))
const acknowledged = computed(() => item.value?.acknowledged_duplicate_ids ?? [])
const strong = computed(() => candidates.value.filter(candidate => candidate.strength === 'strong'))
const unconfirmed = computed(() => strong.value.some(candidate => !acknowledged.value.includes(candidate.album_id)))

const acknowledge = (id: number, on: boolean) => {
  if (!item.value) return
  const ids = new Set(acknowledged.value)
  if (on) ids.add(id)
  else ids.delete(id)
  item.value.acknowledged_duplicate_ids = [...ids]
}

/** Only what duplicates are judged by, so typing elsewhere does not query again. */
const signature = computed(() => JSON.stringify({
  title: album.value.title,
  titles: album.value.titles.map(title => title.title),
  products: album.value.products.map(product => [product.catalog_number, product.barcode]),
  links: album.value.links.map(link => [link.link_provider_id, link.url]),
}))
const worthChecking = () => Boolean(album.value.title?.trim() || album.value.products.some(product => product.catalog_number || product.barcode) || album.value.links.some(link => link.url))

const check = async () => {
  const current = ++requestId
  checking.value = true
  try {
    const data = await $api<{ candidates: DuplicateCandidate[] }>('/v1/albums/duplicate-candidates', {
      method: 'POST',
      body: { document: pruneAlbumDocument(album.value), exclude_id: albumId ?? undefined },
      progress: false,
    })
    if (current === requestId) candidates.value = data.candidates
  } catch {
    // The check only advises; submitting still verifies strong matches.
  } finally {
    if (current === requestId) checking.value = false
  }
}

watch(signature, () => {
  clearTimeout(timer)
  if (!worthChecking()) {
    candidates.value = []
    return
  }
  timer = setTimeout(check, 600)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))

/** Shows the candidates a refused submission listed (DUPLICATE_SUSPECTED) and brings the panel into view. */
const show = async (list: DuplicateCandidate[]) => {
  const known = new Set(candidates.value.map(candidate => candidate.album_id))
  candidates.value = [...candidates.value, ...list.filter(candidate => !known.has(candidate.album_id))]
  await nextTick()
  root.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

defineExpose({ show, unconfirmed })
</script>
