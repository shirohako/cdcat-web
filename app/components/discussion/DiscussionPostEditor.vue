<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import type { DiscussionPost, DiscussionReferences } from '~/types/discussion'

/** Edits the author's own post in place. Moderators edit others' posts through the moderation dialog. */
const props = defineProps<{ post: DiscussionPost, topicId: number }>()
const emit = defineEmits<{ saved: [post: DiscussionPost, references: DiscussionReferences], cancel: [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { resolveEnv, complete } = useDiscussionAssist(() => props.topicId)
const raw = ref(props.post.raw ?? '')
const busy = ref(false)
const error = ref('')
const compact = computed(() => props.post.floor === null)

async function save() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const response = await $api<{ post: DiscussionPost, references: DiscussionReferences }>(`/v1/discussions/posts/${props.post.id}`, { method: 'PUT', body: { raw: raw.value } })
    emit('saved', response.post, response.references)
  }
  catch (failure) {
    error.value = localizeError(failure)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-2">
    <ClientOnly>
      <MarkdownEditor
        v-model="raw" :variant="compact ? 'compact' : 'full'" :mode="compact ? 'edit' : 'split'" :max-length="compact ? 2000 : 20000"
        :guide-url="null" :resolve-env="resolveEnv" :complete="complete" :disabled="busy" @submit="save"
      />
    </ClientOnly>
    <div class="flex items-center justify-end gap-2">
      <p v-if="error" role="alert" class="mr-auto text-sm text-rose-600">{{ error }}</p>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="emit('cancel')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary btn-sm" :disabled="busy || !raw.trim()" @click="save">
        <Loader2 v-if="busy" :size="14" class="animate-spin" />{{ t('common.save') }}
      </button>
    </div>
  </div>
</template>
