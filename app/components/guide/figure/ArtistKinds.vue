<script setup lang="ts">
/**
 * 艺术家: the six artist types, each with an example, then three relations drawn as pairs, the stored name on one
 * side and the name the other side shows on the other, to make the point that a relation is entered once.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const KINDS = [
  { type: 'person', icon: 'lucide:user-round', example: '梶浦由記', shift: 150 },
  { type: 'group', icon: 'lucide:users-round', example: 'Kalafina', shift: 110 },
  { type: 'circle', icon: 'lucide:tent', example: '上海アリス幻樂団', shift: 70 },
  { type: 'company', icon: 'lucide:building-2', example: 'Lantis', shift: 30 },
  { type: 'virtual', icon: 'lucide:audio-waveform', example: '初音ミク', shift: -10 },
  { type: 'character', icon: 'lucide:drama', example: '', shift: -50 },
] as const

/** Made-up artists, as the stored relation and its reverse read. */
const RELATIONS = [
  { from: { name: 'ミナト', icon: 'lucide:user-round' }, to: { name: 'ステラノート', icon: 'lucide:tent' }, stored: 'member_of', reverse: 'has_member' },
  { from: { name: '星野あかり', icon: 'lucide:user-round' }, to: { name: 'ルナ', icon: 'lucide:drama' }, stored: 'voice_of', reverse: 'voiced_by' },
  { from: { name: 'minato', icon: 'lucide:user-round' }, to: { name: 'ミナト', icon: 'lucide:user-round' }, stored: 'persona_of', reverse: 'has_persona' },
] as const
</script>

<template>
  <div aria-hidden="true">
    <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <li v-for="kind in KINDS" :key="kind.type" class="accent flex items-center gap-2.5 rounded-lg bg-card p-2.5 ring-1 ring-line" :style="{ '--shift': kind.shift }">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-(--accent-soft) text-(--accent)">
          <Icon :name="kind.icon" class="size-4" />
        </span>
        <span class="min-w-0">
          <span class="block text-xs font-semibold text-title">{{ t(`catalog.artist_type.${kind.type}`) }}</span>
          <span class="block truncate text-[11px] text-meta">{{ kind.example || text.example_character }}</span>
        </span>
      </li>
    </ul>

    <div class="mt-4 rounded-lg bg-card p-3 ring-1 ring-line">
      <p class="flex items-center gap-1.5 text-xs font-semibold text-title">
        <Icon name="lucide:arrow-left-right" class="size-3.5 text-meta" />{{ text.relations_title }}
      </p>
      <ul class="mt-2.5 space-y-2">
        <li v-for="relation in RELATIONS" :key="relation.stored" class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <span class="flex min-w-0 items-center gap-1.5 rounded-md bg-sunken px-2 py-1 text-[11px] text-title">
            <Icon :name="relation.from.icon" class="size-3 shrink-0 text-meta" /><span class="truncate">{{ relation.from.name }}</span>
          </span>
          <span class="flex flex-col items-center text-[10px] leading-3.5">
            <span class="text-(--accent)">{{ t(`catalog.artist_relation.${relation.stored}`) }} →</span>
            <span class="text-meta">← {{ t(`catalog.artist_relation.${relation.reverse}`) }}</span>
          </span>
          <span class="flex min-w-0 items-center gap-1.5 rounded-md bg-sunken px-2 py-1 text-[11px] text-title">
            <Icon :name="relation.to.icon" class="size-3 shrink-0 text-meta" /><span class="truncate">{{ relation.to.name }}</span>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
