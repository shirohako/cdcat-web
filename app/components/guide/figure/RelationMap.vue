<script setup lang="ts">
/**
 * 总览: the album in the middle, artists and events on its left, entries and series on its right, the vinyl
 * list inside it, and the forum and articles in a band underneath, linked to all of them. Each block is a link to its
 * section; hovering or focusing one lights the connections it takes part in. Below md the map becomes a list.
 *
 * The blocks take the colours of their sections in the guide (see sectionShift), so the map matches the contents.
 */
const props = defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

type Node = 'album' | 'artist' | 'event' | 'entry' | 'franchise' | 'vinyl' | 'discussion' | 'article'

const NODES: Record<Node, { icon: string, label: string, shift: number }> = {
  album: { icon: 'lucide:disc-3', label: 'menu.album', shift: 80 },
  artist: { icon: 'lucide:mic-2', label: 'menu.artist', shift: 150 },
  event: { icon: 'lucide:calendar', label: 'menu.event', shift: -90 },
  entry: { icon: 'lucide:film', label: 'menu.entry', shift: 40 },
  franchise: { icon: 'lucide:library', label: 'menu.series', shift: -60 },
  vinyl: { icon: 'lucide:disc', label: 'menu.vinyl', shift: 190 },
  discussion: { icon: 'lucide:message-circle', label: 'menu.discussion', shift: 0 },
  article: { icon: 'lucide:newspaper', label: 'menu.article', shift: 80 },
}

/** The connections drawn on the map, each between two blocks. */
const LINKS: Array<{ key: string, between: [Node, Node] }> = [
  { key: 'credits', between: ['album', 'artist'] },
  { key: 'release_event', between: ['album', 'event'] },
  { key: 'circles', between: ['event', 'artist'] },
  { key: 'entries', between: ['album', 'entry'] },
  { key: 'in_series', between: ['entry', 'franchise'] },
  { key: 'series_albums', between: ['album', 'franchise'] },
]

const hovered = ref<Node | null>(null)
const hover = (id: string) => { hovered.value = id as Node }
const lit = (key: string) => {
  const link = LINKS.find(item => item.key === key)
  return !!hovered.value && !!link?.between.includes(hovered.value)
}
const node = (id: Node) => ({ id, icon: NODES[id].icon, shift: NODES[id].shift, name: t(NODES[id].label), desc: props.text[id] ?? '' })
/** Below md, each block says how it reaches the album; series through entries. */
const VIA: Partial<Record<Node, string>> = { artist: 'credits', event: 'release_event', entry: 'entries', franchise: 'in_series' }
const others = computed(() => (['artist', 'event', 'entry', 'franchise', 'vinyl', 'discussion', 'article'] as const)
  .map(id => ({ ...node(id), via: VIA[id] ? props.text[VIA[id]!] : null })))
</script>

<template>
  <div @mouseleave="hovered = null">
    <!-- md and up: the map. -->
    <div class="hidden grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1.15fr)_6.5rem_minmax(0,1fr)] grid-rows-[auto_3.25rem_auto] md:grid">
      <GuideFigureMapNode v-bind="node('artist')" class="col-start-1 row-start-1" @hover="hover" />
      <GuideFigureMapLink :label="text.credits" :lit="lit('credits')" class="col-start-2 row-start-1" />
      <div class="col-start-3 row-span-3 row-start-1 flex">
        <GuideFigureMapNode v-bind="node('album')" central class="w-full" @hover="hover">
          <a
            href="#vinyl"
            class="accent mt-3 flex items-center gap-2 rounded-md border border-dashed border-(--accent)/50 bg-(--accent)/8 px-2 py-1.5 transition-colors duration-150 ease-out hover:bg-(--accent-soft)"
            :style="{ '--shift': NODES.vinyl.shift }"
            @mouseenter="hovered = 'vinyl'"
            @focus="hovered = 'vinyl'"
          >
            <Icon :name="NODES.vinyl.icon" class="size-3.5 shrink-0 text-(--accent)" />
            <span class="min-w-0">
              <span class="block text-xs font-semibold text-title">{{ t(NODES.vinyl.label) }}</span>
              <span class="block text-[11px] leading-4 text-meta">{{ text.vinyl }}</span>
            </span>
          </a>
        </GuideFigureMapNode>
      </div>
      <GuideFigureMapLink :label="text.entries" :lit="lit('entries')" class="col-start-4 row-start-1" />
      <GuideFigureMapNode v-bind="node('entry')" class="col-start-5 row-start-1" @hover="hover" />

      <GuideFigureMapLink :label="text.circles" :lit="lit('circles')" vertical class="col-start-1 row-start-2" />
      <GuideFigureMapLink :label="text.in_series" :lit="lit('in_series')" vertical class="col-start-5 row-start-2" />

      <GuideFigureMapNode v-bind="node('event')" class="col-start-1 row-start-3" @hover="hover" />
      <GuideFigureMapLink :label="text.release_event" :lit="lit('release_event')" class="col-start-2 row-start-3" />
      <GuideFigureMapLink :label="text.series_albums" :lit="lit('series_albums')" dashed class="col-start-4 row-start-3" />
      <GuideFigureMapNode v-bind="node('franchise')" class="col-start-5 row-start-3" @hover="hover" />
    </div>

    <!-- The forum and the articles reach every block above. -->
    <div class="mt-4 hidden border-t border-dashed border-line pt-4 md:block">
      <p class="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-meta" :class="{ 'text-title!': hovered === 'discussion' || hovered === 'article' }">
        <Icon name="lucide:arrow-up" class="size-3.5" />{{ text.community }}<Icon name="lucide:arrow-up" class="size-3.5" />
      </p>
      <div class="mx-auto grid max-w-xl grid-cols-2 gap-4">
        <GuideFigureMapNode v-bind="node('discussion')" @hover="hover" />
        <GuideFigureMapNode v-bind="node('article')" @hover="hover" />
      </div>
    </div>

    <!-- Phones: the album, then every other block with the way it connects to the album. -->
    <div class="space-y-2 md:hidden">
      <GuideFigureMapNode v-bind="node('album')" central />
      <div v-for="item in others" :key="item.id" class="flex gap-2">
        <span class="mt-3 w-4 shrink-0 border-t border-l border-line" aria-hidden="true" />
        <GuideFigureMapNode :id="item.id" :icon="item.icon" :shift="item.shift" :name="item.name" :desc="item.desc" class="min-w-0 flex-1">
          <span v-if="item.via" class="mt-1.5 inline-flex items-center gap-1 rounded-sm bg-sunken px-1.5 py-0.5 text-[10px] text-body">
            <Icon name="lucide:link-2" class="size-3 shrink-0 text-faint" />{{ item.via }}
          </span>
        </GuideFigureMapNode>
      </div>
      <p class="pt-1 text-[11px] leading-4 text-meta">{{ text.community }}</p>
    </div>

    <p class="mt-4 text-center text-[11px] text-faint">{{ text.hint }}</p>
  </div>
</template>
