<script setup lang="ts">
import { Bell, BellOff, BellRing, Check, ChevronDown } from '@lucide/vue'
import { NOTIFICATION_LEVELS, type NotificationLevel } from '~/types/discussion'

/** Choose how much you hear about a topic or a category: watching, normal or muted. */
const props = defineProps<{ level: NotificationLevel | null, kind: 'topic' | 'category', targetId: number }>()
const emit = defineEmits<{ 'update:level': [value: NotificationLevel] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const icons = { watching: BellRing, normal: Bell, muted: BellOff }
const current = computed(() => props.level ?? 'normal')

async function choose(level: NotificationLevel) {
  open.value = false
  if (level === current.value) return
  try {
    await $api(`/v1/discussions/${props.kind === 'topic' ? 'topics' : 'categories'}/${props.targetId}/notification-level`, { method: 'PUT', body: { level } })
    emit('update:level', level)
  }
  catch (failure) {
    notice.error(localizeError(failure))
  }
}

const onClickOutside = (event: MouseEvent) => { if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false }
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button" class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
      :class="current === 'watching' ? 'border-sky-200 text-sky-700' : ''" :aria-expanded="open" @click.stop="open = !open"
    >
      <component :is="icons[current]" :size="14" />{{ t(`discussions.levels.${current}`) }}<ChevronDown :size="12" />
    </button>
    <div v-if="open" class="absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg" role="menu">
      <button
        v-for="option in NOTIFICATION_LEVELS" :key="option" type="button" role="menuitemradio" :aria-checked="option === current"
        class="flex w-full items-start gap-2.5 px-3 py-2 text-left transition hover:bg-slate-50" @click="choose(option)"
      >
        <component :is="icons[option]" :size="15" class="mt-0.5 shrink-0 text-slate-500" />
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium text-slate-800">{{ t(`discussions.levels.${option}`) }}</span>
          <span class="block text-xs text-slate-500">{{ t(`discussions.levels.${kind}_help.${option}`) }}</span>
        </span>
        <Check v-if="option === current" :size="14" class="mt-0.5 text-sky-600" />
      </button>
    </div>
  </div>
</template>
