<script setup lang="ts">
/**
 * 参与创作的人, by track: the view switch on 按曲目, the whole album's credits, then a card per track of the guide's
 * booklet. Track 2 is still empty, with 和上一首相同 offered, as it is on every track whose credits differ from the
 * one before. Role names come from the guide's text, as in the by-role figure.
 */
const props = defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const role = (key: string) => props.text[key] ?? key
const ALBUM: Array<{ role: string, people: Array<{ name: string, created?: boolean, printed?: boolean }> }> = [
  { role: 'mastering_engineer', people: [{ name: 'Hoshi Studio', created: true }] },
  { role: 'illustrator', people: [{ name: 'mochi', printed: true }] },
]
const TRACKS = [
  { n: '01', title: '星屑のアトラス', credits: [['composer', 'ミナト'], ['lyricist', 'ミナト'], ['arranger', 'ミナト'], ['vocals', '星野あかり']] },
  { n: '02', title: '夜明けのプラネタリウム', credits: [], copy: true },
  { n: '03', title: '銀河鉄道の切符', credits: [['composer', 'ミナト'], ['arranger', 'ミナト']], copy: true },
  { n: '04', title: '星屑のアトラス (Instrumental)', credits: [['composer', 'Yuki'], ['arranger', 'Yuki']], copy: true },
]
</script>

<template>
  <GuideMockPanel :title="t('editor.album.section.credits')" icon="lucide:contact" aria-hidden="true">
    <p class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <span class="text-[10px] font-bold uppercase tracking-wider text-meta">{{ t('editor.credits.contributors') }}</span>
      <span class="flex gap-0.5 rounded-md bg-sunken p-0.5 text-[10px] font-semibold">
        <span class="rounded-[4px] px-2 py-px text-body">{{ t('editor.credits.view_by_role') }}</span>
        <span class="rounded-[4px] bg-primary px-2 py-px text-on-primary">{{ t('editor.credits.view_by_track') }}</span>
      </span>
    </p>

    <div class="space-y-2">
      <div class="rounded-md ring-1 ring-line">
        <p class="flex items-center gap-1.5 border-b border-line bg-sunken px-2.5 py-1 text-[11px] font-semibold text-title">
          <Icon name="lucide:disc-3" class="size-3 text-meta" />{{ t('editor.credits.whole_album') }}
        </p>
        <div class="space-y-1 px-2.5 py-1.5">
          <p v-for="item in ALBUM" :key="item.role" class="flex items-center gap-2">
            <span class="w-14 shrink-0 truncate text-[11px] font-medium text-primary">{{ role(item.role) }}</span>
            <span
              v-for="person in item.people"
              :key="person.name"
              class="inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-title"
              :class="person.printed ? 'border border-dashed border-field-line' : 'bg-success/12'"
            >
              {{ person.name }}
              <span v-if="person.created" class="rounded-sm bg-success/15 px-1 text-[9px] font-bold text-success">{{ t('editor.new') }}</span>
              <span v-if="person.printed" class="text-[9px] text-meta">{{ t('editor.dialog.name_only') }}</span>
            </span>
            <GuideFigureCreditAdd />
          </p>
        </div>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <div v-for="(track, index) in TRACKS" :key="track.n" class="rounded-md ring-1" :class="index === 1 ? 'ring-primary/45' : 'ring-line'">
          <p class="flex items-center gap-1.5 border-b border-line bg-sunken px-2.5 py-1 text-[11px]">
            <span class="w-5 shrink-0 font-mono text-faint">{{ track.n }}</span>
            <span class="min-w-0 flex-1 truncate font-semibold text-title">{{ track.title }}</span>
            <span
              v-if="track.copy"
              class="inline-flex h-5 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-[10px] font-semibold ring-1 ring-inset"
              :class="index === 1 ? 'bg-primary text-on-primary ring-primary' : 'bg-btn text-btn-content ring-line'"
            ><Icon name="lucide:copy" class="size-2.5" />{{ t('editor.credits.same_as_previous') }}</span>
          </p>
          <div class="space-y-1 px-2.5 py-1.5">
            <p v-for="[key, name] in track.credits" :key="key" class="flex items-center gap-2">
              <span class="w-10 shrink-0 truncate text-[11px] font-medium text-primary">{{ role(key!) }}</span>
              <span class="inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium text-title" :class="name === 'Yuki' ? 'bg-success/12' : 'bg-btn'">{{ name }}</span>
            </p>
            <span class="inline-flex h-5 items-center gap-0.5 rounded-md border border-dashed border-primary/45 bg-primary/8 px-1.5 text-[10px] font-semibold text-primary">
              <Icon name="lucide:plus" class="size-2.5" />{{ t('editor.credits.add_role') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </GuideMockPanel>
</template>
