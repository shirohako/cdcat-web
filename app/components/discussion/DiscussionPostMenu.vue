<script setup lang="ts">
import { Bookmark, BookmarkCheck, CheckCircle2, Flag, Link2, MoreHorizontal, Pencil, Shield, Trash2 } from '@lucide/vue'
import type { DiscussionPost } from '~/types/discussion'

/** The "…" menu of a post: copy link, bookmark, report, and the author's and moderators' actions. */
const props = defineProps<{ post: DiscussionPost, canAccept?: boolean, accepted?: boolean }>()
const emit = defineEmits<{ edit: [], delete: [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { isAuthenticated } = useAuth()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const context = useDiscussionTopic()
const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')

const link = () => `${window.location.origin}/discussions/${props.post.topic_id}?post=${props.post.id}`
async function copyLink() {
  open.value = false
  try {
    await navigator.clipboard.writeText(link())
    notice.success(t('discussions.post.link_copied'))
  }
  catch {
    notice.error(link())
  }
}

async function toggleBookmark() {
  open.value = false
  try {
    const response = await $api<{ bookmarked: boolean }>(`/v1/discussions/posts/${props.post.id}/bookmark`, { method: props.post.bookmarked ? 'DELETE' : 'PUT' })
    context.updated({ ...props.post, bookmarked: response.bookmarked })
    notice.success(response.bookmarked ? t('discussions.post.bookmarked') : t('discussions.post.unbookmarked'))
  }
  catch (failure) {
    notice.error(localizeError(failure))
  }
}

const run = (action: () => void) => {
  open.value = false
  action()
}
const onClickOutside = (event: MouseEvent) => { if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false }
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50'
</script>

<template>
  <div ref="root" class="relative">
    <button type="button" class="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" :aria-label="t('discussions.post.more')" :aria-expanded="open" @click.stop="open = !open">
      <MoreHorizontal :size="16" />
    </button>
    <div v-if="open" class="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg" role="menu">
      <button type="button" role="menuitem" :class="item" @click="copyLink"><Link2 :size="14" />{{ t('discussions.post.copy_link') }}</button>
      <button v-if="isAuthenticated" type="button" role="menuitem" :class="item" @click="toggleBookmark">
        <component :is="post.bookmarked ? BookmarkCheck : Bookmark" :size="14" />{{ post.bookmarked ? t('discussions.post.unbookmark') : t('discussions.post.bookmark') }}
      </button>
      <button v-if="canAccept && post.status === 'visible'" type="button" role="menuitem" :class="item" @click="run(() => context.accept(accepted ? null : post))">
        <CheckCircle2 :size="14" />{{ accepted ? t('discussions.answer.unaccept') : t('discussions.answer.accept') }}
      </button>
      <button v-if="post.can.edit" type="button" role="menuitem" :class="item" @click="run(() => emit('edit'))"><Pencil :size="14" />{{ t('common.edit') }}</button>
      <button v-if="post.can.delete" type="button" role="menuitem" :class="[item, 'text-rose-600']" @click="run(() => emit('delete'))"><Trash2 :size="14" />{{ t('common.delete') }}</button>
      <button v-if="post.can.report" type="button" role="menuitem" :class="item" @click="run(() => context.report(post))"><Flag :size="14" />{{ t('discussions.report.title') }}</button>
      <button v-if="post.can.moderate" type="button" role="menuitem" :class="[item, 'border-t border-slate-100 text-indigo-700']" @click="run(() => context.moderate(post))"><Shield :size="14" />{{ t('discussions.moderation.title') }}</button>
    </div>
  </div>
</template>
