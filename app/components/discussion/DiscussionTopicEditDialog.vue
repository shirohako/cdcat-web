<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import type { ContentLinkSummary, TagSummary } from '~/types/article'
import type { DiscussionTopicDetail } from '~/types/discussion'
import { TAG_NAME_MAX, tagErrorKey, tagPayload } from '~/utils/tags'

/**
 * Changes a topic's title, category, tags and links. Authors save through the
 * topic endpoint; moderators editing someone else's topic give a reason and use
 * the moderation endpoint. Changes mark floor #1 edited; no earlier values are kept.
 */
const props = defineProps<{ topic: DiscussionTopicDetail | null, asModerator?: boolean }>()
const emit = defineEmits<{ close: [], saved: [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const { flat, categoryName, canModerate } = useDiscussionCategories()
const open = computed({ get: () => props.topic !== null, set: (value) => { if (!value) emit('close') } })
const title = ref('')
const categoryId = ref<number | null>(null)
const tags = ref<TagSummary[]>([])
const links = ref<ContentLinkSummary[]>([])
const reason = ref('')
const busy = ref(false)
const error = ref('')
const articleTopic = computed(() => props.topic?.article_id != null && !props.asModerator)
const choices = computed(() => flat.value.filter(category => props.asModerator || category.topic_permission === 'everyone' || category.id === props.topic?.category?.id))

watch(() => props.topic, (topic) => {
  if (!topic) return
  title.value = topic.title
  categoryId.value = topic.category?.id ?? null
  tags.value = [...topic.tags]
  links.value = [...topic.links]
  reason.value = ''
  error.value = ''
}, { immediate: true })

async function save() {
  const topic = props.topic
  if (!topic) return
  busy.value = true
  error.value = ''
  const body: Record<string, unknown> = {
    ...tagPayload(tags.value),
    links: links.value.map(link => ({ type: link.type, id: link.id })),
  }
  if (!articleTopic.value) {
    body.title = title.value.trim()
    body.category_id = categoryId.value
  }
  try {
    if (props.asModerator) await $api(`/v1/admin/discussions/topics/${topic.id}`, { method: 'PATCH', body: { ...body, reason: reason.value.trim() || undefined } })
    else await $api(`/v1/discussions/topics/${topic.id}`, { method: 'PUT', body })
    notice.success(t('discussions.topic.saved'))
    emit('saved')
  }
  catch (failure) {
    const tagError = tagErrorKey((failure as { details?: { details?: Record<string, string[]> } }).details?.details)
    error.value = (failure as { name?: string }).name !== 'VALIDATION_FAILED' ? localizeError(failure)
      : tagError ? t(tagError, { max: TAG_NAME_MAX }) : t('discussions.topic.invalid')
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <DiscussionDialog v-model:open="open" :title="t('discussions.topic.edit_title')" width="max-w-2xl" :busy="busy">
    <form id="discussion-topic-edit" class="space-y-4" @submit.prevent="save">
      <template v-if="!articleTopic">
        <label class="block text-sm font-medium text-slate-700">
          {{ t('discussions.fields.title') }}
          <input v-model="title" required minlength="4" maxlength="120" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400">
        </label>
        <label class="block text-sm font-medium text-slate-700">
          {{ t('discussions.fields.category') }}
          <select v-model="categoryId" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option v-for="category in choices" :key="category.id" :value="category.id">{{ category.parent_id ? '\u3000' : '' }}{{ categoryName(category) }}</option>
          </select>
        </label>
      </template>
      <div class="text-sm font-medium text-slate-700">
        {{ t('discussions.fields.tags') }}
        <CommonTagPicker v-model="tags" class="mt-1" :max="5" :allow-staff="canModerate" />
      </div>
      <div class="text-sm font-medium text-slate-700">
        {{ t('discussions.fields.links') }}
        <CommonContentLinkPicker v-model="links" class="mt-1" :max="10" />
      </div>
      <label v-if="asModerator" class="block text-sm font-medium text-slate-700">
        {{ t('discussions.moderation.reason_optional') }}
        <input v-model="reason" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
      </label>
      <p v-if="error" role="alert" class="text-sm text-rose-600">{{ error }}</p>
    </form>
    <template #footer>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="submit" form="discussion-topic-edit" class="btn btn-primary btn-sm" :disabled="busy"><Loader2 v-if="busy" :size="14" class="animate-spin" />{{ t('common.save') }}</button>
    </template>
  </DiscussionDialog>
</template>
