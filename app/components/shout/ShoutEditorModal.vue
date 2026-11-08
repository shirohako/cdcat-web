<template>
  <!-- The album comment editor's frame (ReviewEditorModal) with only the text: shouts have no rating or language. -->
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

      <div class="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-card text-body shadow-overlay ring-1 ring-line">
        <div class="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <div class="flex items-center gap-2.5">
            <UiIconTile :icon="MessageSquareQuote" />
            <h2 class="text-base font-bold text-title">{{ $t(content ? 'shouts.edit' : 'shouts.write') }}</h2>
          </div>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full text-meta transition-colors hover:bg-black/[0.08] hover:text-primary dark:hover:bg-white/[0.1]" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5">
          <MarkdownEditor v-model="draft" :disabled="submitting" :placeholder="$t('shouts.placeholder')" />
          <div class="mt-1.5 flex justify-end">
            <span class="text-xs tabular-nums" :class="draft.length > SHOUT_MAX_LENGTH ? 'text-danger' : 'text-meta'">
              {{ draft.length }} / {{ SHOUT_MAX_LENGTH }}
            </span>
          </div>
        </div>

        <div v-if="errorMessage" class="mx-6 mb-4 rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-sm text-danger">{{ errorMessage }}</div>

        <div class="flex shrink-0 items-center justify-end gap-2 border-t border-line px-6 py-4">
          <UiButton size="sm" @click="emit('close')">{{ $t('common.cancel') }}</UiButton>
          <UiButton variant="primary" size="sm" :loading="submitting" :disabled="!canSubmit" @click="submit">
            {{ $t(content ? 'shouts.update' : 'shouts.post') }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Shout } from '~/types/shout'
import { SHOUT_MAX_LENGTH } from '~/types/shout'
import { MessageSquareQuote, X } from '@lucide/vue'

/** Writes the viewer's shout (Markdown) on an artist, or edits it when `content` is given. */
const props = defineProps<{ resource: 'artists', id: number, content?: string | null }>()
const emit = defineEmits<{ close: [], saved: [shout: Shout] }>()

const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()

const draft = ref(props.content ?? '')
const submitting = ref(false)
const errorMessage = ref('')
const canSubmit = computed(() => draft.value.trim().length > 0 && draft.value.length <= SHOUT_MAX_LENGTH)

const submit = async () => {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    emit('saved', await $api<Shout>(`/v1/${props.resource}/${props.id}/shout`, { method: 'PUT', body: { content: draft.value.trim() } }))
  } catch (error) {
    errorMessage.value = localizeError(error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => { document.body.style.overflow = 'hidden' })
onUnmounted(() => { document.body.style.overflow = '' })
</script>
