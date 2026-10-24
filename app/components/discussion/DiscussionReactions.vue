<script setup lang="ts">
import { SmilePlus } from '@lucide/vue'
import { DISCUSSION_REACTIONS, DISCUSSION_REACTION_EMOJI, type DiscussionReactionCount, type DiscussionReactionKey } from '~/types/discussion'
import type { UserSummary } from '~/types/article'

/**
 * Reaction chips under a post. Each person may leave several different reactions;
 * clicking a chip adds or removes theirs. Hovering a chip loads who reacted.
 */
const props = defineProps<{ postId: number, reactions: DiscussionReactionCount[], canReact: boolean, compact?: boolean }>()
const emit = defineEmits<{ 'update:reactions': [value: DiscussionReactionCount[]] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const pickerOpen = ref(false)
const busy = ref(false)
const who = ref<Partial<Record<DiscussionReactionKey, string>>>({})
const root = useTemplateRef<HTMLElement>('root')

async function toggle(reaction: DiscussionReactionKey) {
  if (!props.canReact || busy.value) return
  pickerOpen.value = false
  const current = props.reactions.find(item => item.reaction === reaction)
  busy.value = true
  try {
    const response = await $api<{ reactions: DiscussionReactionCount[] }>(`/v1/discussions/posts/${props.postId}/reactions/${reaction}`, { method: current?.reacted ? 'DELETE' : 'PUT' })
    emit('update:reactions', response.reactions)
    who.value = { ...who.value, [reaction]: undefined }
  }
  catch (failure) {
    notice.error(localizeError(failure))
  }
  finally {
    busy.value = false
  }
}

async function loadWho(reaction: DiscussionReactionKey, count: number) {
  if (who.value[reaction] !== undefined) return
  who.value[reaction] = ''
  try {
    const response = await $api<{ users: UserSummary[] }>(`/v1/discussions/posts/${props.postId}/reactions`, { query: { reaction } })
    const names = response.users.slice(0, 8).map(user => user.nickname || user.username)
    who.value[reaction] = count > names.length ? t('discussions.reactions.and_more', { names: names.join('、'), count }) : names.join('、')
  }
  catch {
    who.value = { ...who.value, [reaction]: undefined }
  }
}

const onClickOutside = (event: MouseEvent) => { if (pickerOpen.value && root.value && !root.value.contains(event.target as Node)) pickerOpen.value = false }
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="relative flex flex-wrap items-center gap-1.5">
    <button
      v-for="item in reactions" :key="item.reaction" type="button"
      class="inline-flex items-center gap-1 rounded-full border text-xs tabular-nums transition-colors duration-150 ease-out"
      :class="[
        item.reacted ? 'border-primary/40 bg-primary/15 text-primary' : 'border-line text-body hover:bg-ghost-hover',
        compact ? 'h-6 px-1.5' : 'h-7 px-2',
        canReact ? '' : 'cursor-default',
      ]"
      :title="who[item.reaction] || undefined"
      :aria-pressed="item.reacted"
      :aria-label="t('discussions.reactions.label', { emoji: DISCUSSION_REACTION_EMOJI[item.reaction], count: item.count })"
      @mouseenter="loadWho(item.reaction, item.count)" @focus="loadWho(item.reaction, item.count)" @click="toggle(item.reaction)"
    >
      <span class="text-sm leading-none">{{ DISCUSSION_REACTION_EMOJI[item.reaction] }}</span>{{ item.count }}
    </button>
    <button
      v-if="canReact" type="button"
      class="grid place-items-center rounded-full border border-dashed border-faint text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
      :class="compact ? 'size-6' : 'size-7'" :aria-label="t('discussions.reactions.add')" :aria-expanded="pickerOpen" @click.stop="pickerOpen = !pickerOpen"
    >
      <SmilePlus :size="compact ? 12 : 14" />
    </button>
    <!-- w-max: an absolute box is otherwise only as wide as the chips row, which squeezes the grid. -->
    <div v-if="pickerOpen" class="absolute bottom-full left-0 z-20 mb-1.5 grid w-max grid-cols-8 gap-0.5 rounded-xl bg-popover p-1.5 shadow-overlay ring-1 ring-line" role="menu">
      <button
        v-for="reaction in DISCUSSION_REACTIONS" :key="reaction" type="button" role="menuitem"
        class="grid size-8 place-items-center rounded-lg text-lg transition-colors duration-150 ease-out hover:bg-ghost-hover"
        :class="reactions.find(item => item.reaction === reaction)?.reacted ? 'bg-primary/15' : ''"
        :aria-label="t(`discussions.reactions.names.${reaction}`)" :title="t(`discussions.reactions.names.${reaction}`)" @click="toggle(reaction)"
      >
        {{ DISCUSSION_REACTION_EMOJI[reaction] }}
      </button>
    </div>
  </div>
</template>
