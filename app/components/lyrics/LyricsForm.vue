<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label class="form-control">
        <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.kind') }}</span>
        <select v-model="form.kind" class="select select-sm" :disabled="!!lyric">
          <option v-for="kind in LYRIC_KINDS" :key="kind" :value="kind" :disabled="kind === 'original' && hasOtherOriginal">{{ enumLabel('lyric_kind', kind) }}</option>
        </select>
      </label>
      <label class="form-control">
        <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.language') }}</span>
        <input v-model.trim="form.language" list="lyric-languages" class="input input-sm" placeholder="ja, zh-Hans, ja-Latn …" required>
        <datalist id="lyric-languages">
          <option v-for="code in LANGUAGES" :key="code" :value="code">{{ localeName(code) }}</option>
        </datalist>
      </label>
      <label class="form-control">
        <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.format') }}</span>
        <select v-model="form.format" class="select select-sm">
          <option v-for="format in LYRIC_FORMATS" :key="format" :value="format">{{ $t(`lyrics_ui.format_${format}`) }}</option>
        </select>
      </label>
    </div>

    <label v-if="form.kind !== 'original' && originals.length" class="form-control">
      <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.translation_of') }}</span>
      <select v-model="form.translation_of_id" class="select select-sm">
        <option :value="null">—</option>
        <option v-for="original in originals" :key="original.id" :value="original.id">{{ localeName(original.language) }}</option>
      </select>
    </label>

    <label class="form-control">
      <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.content') }}</span>
      <textarea v-model="form.content" rows="12" class="textarea font-mono text-sm leading-6" :placeholder="$t('lyrics_ui.content_placeholder')" required />
    </label>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label v-if="form.kind !== 'original'" class="form-control">
        <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.translator_field') }}</span>
        <input v-model.trim="form.translator" class="input input-sm">
      </label>
      <label class="form-control">
        <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.source') }}</span>
        <input v-model.trim="form.source" class="input input-sm">
      </label>
    </div>
    <label class="flex items-center gap-2 text-xs text-gray-600">
      <input v-model="form.is_ai_generated" type="checkbox" class="checkbox checkbox-xs">{{ $t('lyrics_ui.ai_generated') }}
    </label>
    <label v-if="lyric" class="form-control">
      <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.summary') }}</span>
      <input v-model.trim="form.summary" class="input input-sm" :placeholder="$t('lyrics_ui.summary_placeholder')">
    </label>

    <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
    <p class="text-[11px] text-gray-400">{{ $t('lyrics_ui.moderation_hint') }}</p>
    <div class="flex justify-end gap-2">
      <button type="button" class="btn btn-sm btn-ghost" @click="$emit('cancel')">{{ $t('common.cancel') }}</button>
      <button type="submit" class="btn btn-sm btn-primary" :disabled="saving">
        <span v-if="saving" class="loading loading-spinner loading-xs" />{{ $t('common.save') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Lyric, LyricInput, LyricSummary } from '~/types/lyric'
import type { Revision } from '~/types/revision'
import { LYRIC_FORMATS, LYRIC_KINDS } from '~/types/lyric'

const props = defineProps<{ workId: number, lyric: Lyric | null, originals: LyricSummary[] }>()
const emit = defineEmits<{ saved: [{ revision: Revision, lyric: Lyric | null }], cancel: [] }>()

const LANGUAGES = ['ja', 'ja-Latn', 'zh-Hans', 'zh-Hant', 'en', 'ko']

const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { localeName, enumLabel } = useCatalogDisplay()

const form = reactive<LyricInput>({
  kind: props.lyric?.kind ?? (props.originals.length ? 'translation' : 'original'),
  language: props.lyric?.language ?? '',
  format: props.lyric?.format ?? 'plain',
  content: props.lyric?.content ?? '',
  translation_of_id: props.lyric?.translation_of_id ?? props.originals[0]?.id ?? null,
  source: props.lyric?.source ?? '',
  translator: props.lyric?.translator ?? '',
  is_ai_generated: props.lyric?.is_ai_generated ?? false,
  summary: '',
})
const hasOtherOriginal = computed(() => props.originals.some(original => original.id !== props.lyric?.id))

const saving = ref(false)
const errorMessage = ref('')

const submit = async () => {
  saving.value = true
  errorMessage.value = ''
  const body = {
    ...form,
    translation_of_id: form.kind === 'original' ? null : form.translation_of_id,
    translator: form.kind === 'original' ? null : form.translator || null,
    source: form.source || null,
    summary: form.summary || null,
  }
  try {
    const result = props.lyric
      ? await $api<{ revision: Revision, lyric: Lyric | null }>(`/v1/lyrics/${props.lyric.id}`, { method: 'PUT', body })
      : await $api<{ revision: Revision, lyric: Lyric | null }>(`/v1/works/${props.workId}/lyrics`, { method: 'POST', body })
    emit('saved', result)
  } catch (err) {
    errorMessage.value = localizeError(err)
  } finally {
    saving.value = false
  }
}
</script>
