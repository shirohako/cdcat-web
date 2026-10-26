<script setup lang="ts">
// Which track of the kept album each track of the merged album becomes (docs/catalog/editing.md#合并专辑).
// Defaults to the same disc and track number; favorites of a track left unmapped are removed.
import type { AdminMergeTrack } from '~/types/admin'

const props = defineProps<{
  sourceTracks: AdminMergeTrack[]
  targetTracks: AdminMergeTrack[]
  modelValue: Record<string, number | null>
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: Record<string, number | null>] }>()

const byId = computed(() => new Map(props.targetTracks.map(track => [track.id, track])))
const position = (track: AdminMergeTrack) => `${track.disc_number}-${String(track.track_number).padStart(2, '0')}`
const differs = (source: AdminMergeTrack) => {
  const target = byId.value.get(props.modelValue[source.id] ?? 0)
  return !target || target.title.trim().toLowerCase() !== source.title.trim().toLowerCase()
}
const choose = (source: number, value: string) => {
  emit('update:modelValue', { ...props.modelValue, [source]: value ? Number(value) : null })
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[32rem] text-sm">
      <thead class="text-left text-xs text-slate-500">
        <tr>
          <th class="py-1.5 pr-3 font-medium">这张专辑的曲目</th>
          <th class="py-1.5 font-medium">对应到保留方的曲目</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="track in sourceTracks" :key="track.id" :class="{ 'bg-amber-50': differs(track) }">
          <td class="py-1.5 pr-3">
            <span class="mr-2 font-mono text-xs text-slate-400">{{ position(track) }}</span>{{ track.title }}
          </td>
          <td class="py-1.5">
            <select
              :value="modelValue[track.id] ?? ''"
              :disabled="disabled"
              :aria-label="`“${track.title}”对应的曲目`"
              class="w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
              @change="choose(track.id, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">不对应（收藏会删除）</option>
              <option v-for="target in targetTracks" :key="target.id" :value="target.id">{{ position(target) }} {{ target.title }}</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
