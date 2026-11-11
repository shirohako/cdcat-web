<template>
  <!-- No card with neither text nor facts (user ask, 2026-11-11); facts alone keep it -->
  <section v-if="album.description || hasInfo" class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.description')" :icon="FileText" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5" />

    <div class="px-5 pb-5 pt-2">
      <!-- Taller than COLLAPSED_REM and the card folds there, fading out, until expanded. The page comes from the
           server already clipped, so long text doesn't jump; once measured, text that fits is let out. -->
      <div class="relative" :class="!expanded && (folds || !measured) && 'max-h-72 overflow-hidden'">
        <div ref="body">
          <CatalogPlainText v-if="album.description" :text="album.description" class="text-body" />

          <!-- The album's facts (once the side column's 信息 card) as a table under the text: a faint label column,
               the attributes as rows of it too. Whatever the hero already shows stays out of it. -->
          <CatalogInfoTable v-if="hasInfo" :class="album.description && 'mt-4'">
            <CatalogInfoRow v-if="otherTitles.length" :label="$t('catalog.other_names')">
              <CatalogTitleList :titles="otherTitles" />
            </CatalogInfoRow>

            <!-- Who labels, sells, makes and plans the album, each name once with all its roles. Names in these rows are
                 grey tags (the people's, CatalogCreditPersonTag, for artists), links marked as the reader chose for
                 credited names (可点的名字), what follows them grey labels in the middle of the tag's first line (as in
                 其他名称, CatalogTitleList). -->
            <CatalogInfoRow v-if="releasers.length" :label="$t('album.info.people')">
              <ul class="space-y-1">
                <li v-for="releaser in releasers" :key="releaser.key" class="flex flex-wrap items-start gap-x-2 gap-y-1">
                  <CatalogCreditPersonTag :name="releaser.name" :artist-id="releaser.id" :artist-name="releaser.artistName" />
                  <span class="flex h-5 shrink-0 items-center gap-1">
                    <AlbumTracklistLabel v-for="role in releaser.roles" :key="role">{{ roleName(role) }}</AlbumTracklistLabel>
                  </span>
                </li>
              </ul>
            </CatalogInfoRow>

            <CatalogAttributeList v-if="album.attributes.length" :attributes="album.attributes" rows />

            <CatalogInfoRow v-if="album.entries.length" :label="$t('content_display.linked_entries')">
              <ul class="space-y-1">
                <li v-for="entry in album.entries" :key="entry.id" class="flex flex-wrap items-start gap-x-2 gap-y-1">
                  <CatalogNameTag :to="`/entries/${entry.id}`">{{ entry.name }}</CatalogNameTag>
                  <span v-if="albumRelationLabel(entry.relation_type)" class="flex h-5 shrink-0 items-center">
                    <AlbumTracklistLabel>{{ albumRelationLabel(entry.relation_type) }}</AlbumTracklistLabel>
                  </span>
                </li>
              </ul>
            </CatalogInfoRow>

            <CatalogInfoRow v-if="album.franchises.length" :label="$t('catalog.belongs_to')">
              <span class="flex flex-wrap gap-1">
                <CatalogNameTag v-for="franchise in album.franchises" :key="franchise.id" :to="`/franchises/${franchise.id}`">{{ franchise.name }}</CatalogNameTag>
              </span>
            </CatalogInfoRow>
          </CatalogInfoTable>
        </div>
        <div v-if="folds && !expanded" class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card" />
      </div>

      <div v-if="folds" class="mt-3 flex justify-center">
        <UiButton size="xs" :icon-right="expanded ? ChevronUp : ChevronDown" @click="toggle">
          {{ $t(expanded ? 'album.overview.collapse' : 'album.overview.expand') }}
        </UiButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Album } from '~/types/album'
import { ChevronDown, ChevronUp, FileText } from '@lucide/vue'
import { RELEASE_ROLES } from '~/types/album'

/** The album's 简介 and, under it, the facts the hero leaves out: other names, labels and the like, attributes, entries, series. */
const props = defineProps<{ album: Album }>()

const { roleName } = useCatalogSchema()
const { localName } = useCatalogDisplay()
const { albumRelationLabel } = useEntryDisplay()

/** The names but the two the hero shows: the original title and the one for this language. */
const otherTitles = computed(() => {
  const shown = [props.album.title, localName(props.album.title, props.album.titles)]
  return props.album.titles.filter(title => !shown.includes(title.title))
})

/** The album-wide 署名与发行 credits but 艺术家 and 发行 (the hero shows those), grouped by name, roles in their fixed order. */
const releasers = computed(() => {
  const rows = new Map<string, { key: string, id: number | null, name: string, artistName: string | null, roles: string[] }>()
  for (const credit of props.album.credits) {
    if (credit.role === 'artist' || credit.role === 'publisher' || !(RELEASE_ROLES as readonly string[]).includes(credit.role)) continue
    const name = credit.credited_as || credit.artist?.name || ''
    const key = credit.artist ? `id:${credit.artist.id}:${name}` : `name:${name}`
    const row = rows.get(key) ?? { key, id: credit.artist?.id ?? null, name, artistName: credit.artist?.name ?? null, roles: [] }
    if (!row.roles.includes(credit.role)) row.roles.push(credit.role)
    rows.set(key, row)
  }
  const order = (role: string) => (RELEASE_ROLES as readonly string[]).indexOf(role)
  return [...rows.values()].map(row => ({ ...row, roles: row.roles.sort((a, b) => order(a) - order(b)) }))
})

/** max-h-72 (18rem); content up to two lines (3rem) taller still shows whole, as folding it would hide next to nothing. */
const COLLAPSED_REM = 18
const SLACK_REM = 3
const body = ref<HTMLElement | null>(null)
const measured = ref(false)
const folds = ref(false)
const expanded = ref(false)
let observer: ResizeObserver | null = null
onMounted(() => {
  if (!body.value) return
  observer = new ResizeObserver(() => {
    folds.value = (body.value?.offsetHeight ?? 0) > remToPx(COLLAPSED_REM + SLACK_REM)
    measured.value = true
  })
  observer.observe(body.value)
})
onBeforeUnmount(() => observer?.disconnect())
// Another album in the same page starts folded again.
watch(() => props.album.id, () => { expanded.value = false })

/** Folding back from far down brings the card's top into view, so the page doesn't seem to jump away. */
const toggle = () => {
  expanded.value = !expanded.value
  if (!expanded.value) {
    const top = body.value?.closest('section')?.getBoundingClientRect().top ?? 0
    if (top < 0) body.value?.closest('section')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
}

const hasInfo = computed(() => Boolean(otherTitles.value.length || releasers.value.length
  || props.album.attributes.length || props.album.entries.length || props.album.franchises.length))
</script>
