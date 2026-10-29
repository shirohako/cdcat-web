<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.description')" :icon="FileText" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5" />

    <!-- Neither text nor facts: one line, like the other cards. -->
    <CatalogEmptyLine v-if="!album.description && !hasInfo" :icon="FileText" :text="$t('album.empty.description')" />

    <div v-else class="px-5 pb-5 pt-2">
      <!-- Taller than COLLAPSED_HEIGHT and the card folds there, fading out, until expanded. The page comes from the
           server already clipped, so long text doesn't jump; once measured, text that fits is let out. -->
      <div class="relative" :class="!expanded && (folds || !measured) && 'max-h-72 overflow-hidden'">
        <div ref="body">
          <RichContent v-if="album.description" :content="album.description" format="markdown" class="text-body" />

          <!-- The album's facts (once the side column's 信息 card) as a table under the text: a faint label column,
               the attributes as rows of it too. -->
          <CatalogInfoTable v-if="hasInfo" :class="album.description && 'mt-4'">
            <CatalogInfoRow v-if="album.titles.length" :label="$t('catalog.other_names')">
              <CatalogTitleList :titles="album.titles" />
            </CatalogInfoRow>

            <!-- Who publishes, labels, sells, makes and plans the album, each name once with all its roles -->
            <CatalogInfoRow v-if="releasers.length" :label="$t('album.info.people')">
              <ul class="space-y-1">
                <li v-for="releaser in releasers" :key="releaser.key" class="flex items-baseline gap-2">
                  <NuxtLink v-if="releaser.id" :to="`/artists/${releaser.id}`" class="min-w-0 truncate text-title transition-colors hover:text-primary">{{ releaser.name }}</NuxtLink>
                  <span v-else class="min-w-0 truncate text-title">{{ releaser.name }}</span>
                  <span class="shrink-0 text-[11px] text-meta">{{ releaser.roles.map(roleName).join(', ') }}</span>
                </li>
              </ul>
            </CatalogInfoRow>

            <CatalogInfoRow v-if="album.release_event" :label="$t('album.info.release_event')">
              <NuxtLink :to="`/albums?event=${album.release_event.id}`" class="text-title transition-colors hover:text-primary">{{ album.release_event.name }}</NuxtLink>
            </CatalogInfoRow>

            <CatalogAttributeList v-if="album.attributes.length" :attributes="album.attributes" rows />

            <CatalogInfoRow v-if="album.entries.length" :label="$t('content_display.linked_entries')">
              <ul class="space-y-1">
                <li v-for="entry in album.entries" :key="entry.id" class="flex items-baseline gap-2">
                  <NuxtLink :to="`/entries/${entry.id}`" class="min-w-0 truncate text-title transition-colors hover:text-primary">{{ entry.name }}</NuxtLink>
                  <span class="shrink-0 text-[11px] text-meta">{{ albumRelationLabel(entry.relation_type) }}</span>
                </li>
              </ul>
            </CatalogInfoRow>

            <CatalogInfoRow v-if="album.franchises.length" :label="$t('catalog.belongs_to')">
              <span class="flex flex-wrap gap-x-3">
                <NuxtLink v-for="franchise in album.franchises" :key="franchise.id" :to="`/franchises/${franchise.id}`" class="text-title transition-colors hover:text-primary">{{ franchise.name }}</NuxtLink>
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

/** The album's 简介 and, under it, its facts: other names, who releases it, the event, attributes, entries, series. */
const props = defineProps<{ album: Album }>()

const { roleName } = useCatalogSchema()
const { albumRelationLabel } = useEntryDisplay()

/** The album-wide 署名与发行 credits but 署名艺术家 (the hero shows those), grouped by name, roles in their fixed order. */
const releasers = computed(() => {
  const rows = new Map<string, { key: string, id: number | null, name: string, roles: string[] }>()
  for (const credit of props.album.credits) {
    if (credit.role === 'artist' || !(RELEASE_ROLES as readonly string[]).includes(credit.role)) continue
    const name = credit.credited_as || credit.artist?.name || ''
    const key = credit.artist ? `id:${credit.artist.id}:${name}` : `name:${name}`
    const row = rows.get(key) ?? { key, id: credit.artist?.id ?? null, name, roles: [] }
    if (!row.roles.includes(credit.role)) row.roles.push(credit.role)
    rows.set(key, row)
  }
  const order = (role: string) => (RELEASE_ROLES as readonly string[]).indexOf(role)
  return [...rows.values()].map(row => ({ ...row, roles: row.roles.sort((a, b) => order(a) - order(b)) }))
})

/** max-h-72 in pixels; content up to two lines taller still shows whole, as folding it would hide next to nothing. */
const COLLAPSED_HEIGHT = 288
const SLACK = 48
const body = ref<HTMLElement | null>(null)
const measured = ref(false)
const folds = ref(false)
const expanded = ref(false)
let observer: ResizeObserver | null = null
onMounted(() => {
  if (!body.value) return
  observer = new ResizeObserver(() => {
    folds.value = (body.value?.offsetHeight ?? 0) > COLLAPSED_HEIGHT + SLACK
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

const hasInfo = computed(() => Boolean(props.album.titles.length || releasers.value.length || props.album.release_event
  || props.album.attributes.length || props.album.entries.length || props.album.franchises.length))
</script>
