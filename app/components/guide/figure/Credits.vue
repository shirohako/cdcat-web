<script setup lang="ts">
/**
 * 参与创作的人: the section as the editor draws it, filled in with the guide's booklet. The byline block (署名艺术家
 * and 发行 with the list preview), the view switch on 按角色, the booklet's six lines and the buttons that start one.
 * Markers 1–4 match the steps under the figure: roles, people, tracks, and a person's tag (here a new artist still
 * without a type). Role names come from the guide's text: the real ones are in the catalog schema, which this page
 * doesn't load.
 */
const props = defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const role = (key: string) => props.text[key] ?? key
interface Line {
  roles: string[]
  people: Array<{ name: string, untyped?: boolean, created?: boolean, printed?: boolean }>
  tracks: number[]
}
/** The guide's booklet lines, in the dictionary's role order as the editor sorts them. */
const LINES: Line[] = [
  { roles: ['composer', 'arranger'], people: [{ name: 'ミナト' }], tracks: [1, 2, 3] },
  { roles: ['composer', 'arranger'], people: [{ name: 'Yuki', untyped: true }], tracks: [4] },
  { roles: ['lyricist'], people: [{ name: 'ミナト' }], tracks: [1, 2] },
  { roles: ['vocals'], people: [{ name: '星野あかり' }], tracks: [1, 2] },
  { roles: ['mastering_engineer'], people: [{ name: 'Hoshi Studio', created: true }], tracks: [] },
  { roles: ['illustrator'], people: [{ name: 'mochi', printed: true }], tracks: [] },
]
const QUICK = ['composer', 'arranger', 'vocals', 'illustrator']
</script>

<template>
  <GuideMockPanel :title="t('editor.album.section.credits')" icon="lucide:contact" aria-hidden="true">
    <template #actions>
      <GuideMockButton :label="t('editor.paste_credits.button')" icon="lucide:clipboard-paste" class="h-6!" />
    </template>

    <div class="rounded-md ring-1 ring-line">
      <p class="flex flex-wrap items-baseline gap-x-2 border-b border-line bg-sunken px-2.5 py-1">
        <span class="text-[11px] font-semibold text-title">{{ t('editor.credits.byline_title') }}</span>
        <span class="text-[10px] text-meta">{{ t('editor.credits.byline_hint') }}</span>
      </p>
      <div class="space-y-1.5 px-2.5 py-2">
        <p v-for="key in ['artist', 'publisher']" :key="key" class="flex items-center gap-2">
          <span class="w-20 shrink-0 text-[11px] font-medium text-primary">{{ role(key) }}</span>
          <span class="inline-flex h-6 items-center rounded-md bg-btn px-2 text-[11px] font-medium text-title">ステラノート</span>
          <GuideFigureCreditAdd />
        </p>
        <p class="rounded-sm bg-sunken px-2 py-1 text-[11px] text-body">
          <span class="mr-2 text-[10px] uppercase tracking-wider text-meta">{{ t('editor.album.byline_preview') }}</span>ステラノート
        </p>
      </div>
    </div>

    <p class="mb-2 mt-3 flex flex-wrap items-center justify-between gap-2">
      <span class="text-[10px] font-bold uppercase tracking-wider text-meta">{{ t('editor.credits.contributors') }}</span>
      <span class="flex gap-0.5 rounded-md bg-sunken p-0.5 text-[10px] font-semibold">
        <span class="rounded-[4px] bg-primary px-2 py-px text-on-primary">{{ t('editor.credits.view_by_role') }}</span>
        <span class="rounded-[4px] px-2 py-px text-body">{{ t('editor.credits.view_by_track') }}</span>
      </span>
    </p>
    <ul class="space-y-1">
      <li v-for="(line, index) in LINES" :key="index" class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-md bg-sunken px-2 py-1.5">
        <span class="relative">
          <GuideMockMarker v-if="index === 0" :n="1" class="absolute -left-2 -top-2 z-10" />
          <span class="inline-flex h-6 items-center gap-1 rounded-md border border-field-line bg-field px-1.5 text-[11px] font-semibold text-title">
            {{ line.roles.map(role).join('、') }}<Icon name="lucide:chevron-down" class="size-2.5 text-meta" />
          </span>
        </span>
        <span class="relative flex min-w-0 flex-1 basis-32 flex-wrap items-center gap-1">
          <GuideMockMarker v-if="index === 0" :n="2" class="absolute -left-2 -top-2 z-10" />
          <span
            v-for="person in line.people"
            :key="person.name"
            class="relative inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-title"
            :class="person.printed ? 'border border-dashed border-field-line' : person.untyped || person.created ? 'bg-success/12' : 'bg-btn'"
          >
            <GuideMockMarker v-if="person.untyped" :n="4" class="absolute -left-2 -top-2 z-10" />
            {{ person.name }}
            <span v-if="person.untyped" class="rounded-sm bg-warning/15 px-1 text-[9px] font-bold text-warning">{{ t('editor.credits.pick_type') }}</span>
            <span v-if="person.created" class="rounded-sm bg-success/15 px-1 text-[9px] font-bold text-success">{{ t('editor.new') }}</span>
            <span v-if="person.printed" class="text-[9px] text-meta">{{ t('editor.dialog.name_only') }}</span>
          </span>
          <GuideFigureCreditAdd />
        </span>
        <span class="relative ml-auto inline-flex items-center gap-0.5">
          <GuideMockMarker v-if="index === 0" :n="3" class="absolute -left-2 -top-2 z-10" />
          <span
            v-for="n in 4"
            :key="n"
            class="grid h-5 min-w-5 place-items-center rounded-[4px] border font-mono text-[10px]"
            :class="line.tracks.includes(n) ? 'border-primary bg-primary text-on-primary' : 'border-line bg-card text-meta'"
          >{{ n }}</span>
          <span v-if="!line.tracks.length" class="ml-1 text-[10px] text-meta">{{ t('editor.credits.whole_album') }}</span>
        </span>
      </li>
    </ul>
    <p class="mt-2 flex flex-wrap items-center gap-1">
      <span class="mr-0.5 text-[10px] text-meta">{{ t('editor.credits.add_line') }}</span>
      <span v-for="key in QUICK" :key="key" class="inline-flex h-6 items-center gap-0.5 rounded-md border border-dashed border-primary/45 bg-primary/8 px-1.5 text-[11px] font-semibold text-primary">
        <Icon name="lucide:plus" class="size-2.5" />{{ role(key) }}
      </span>
      <span class="inline-flex h-6 items-center rounded-md bg-btn px-1.5 text-[11px] font-semibold text-btn-content ring-1 ring-inset ring-line">{{ t('editor.credits.more_roles') }}</span>
    </p>
  </GuideMockPanel>
</template>
