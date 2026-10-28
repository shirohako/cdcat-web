<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label class="form-control">
        <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.kind') }}</span>
        <UiSelect v-model="form.kind" :options="kindOptions" size="sm" :disabled="!!lyric" />
      </label>
      <label class="form-control">
        <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.language') }}</span>
        <UiLanguageSelect v-model="form.language" :suggested="originals.map(original => original.language)" readings size="sm" :invalid="tried && !form.language" />
      </label>
      <label class="form-control">
        <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.format') }}</span>
        <UiSelect v-model="form.format" :options="formatOptions" size="sm" />
      </label>
    </div>

    <label v-if="form.kind !== 'original' && originals.length" class="form-control">
      <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.translation_of') }}</span>
      <UiSelect v-model="form.translation_of_id" :options="originalOptions" size="sm" />
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
    <label class="flex items-center gap-2 text-xs text-body">
      <input v-model="form.is_ai_generated" type="checkbox" class="checkbox checkbox-xs">{{ $t('lyrics_ui.ai_generated') }}
    </label>
    <label v-if="lyric" class="form-control">
      <span class="label-text mb-1 text-xs">{{ $t('lyrics_ui.summary') }}</span>
      <input v-model.trim="form.summary" class="input input-sm" :placeholder="$t('lyrics_ui.summary_placeholder')">
    </label>

    <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>
    <p class="text-[11px] text-meta">{{ $t('lyrics_ui.moderation_hint') }}</p>
    <div class="flex justify-end gap-2">
      <UiButton size="sm" @click="$emit('cancel')">{{ $t('common.cancel') }}</UiButton>
      <UiButton type="submit" variant="primary" size="sm" :loading="saving">{{ $t('common.save') }}</UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Lyric, LyricFormat, LyricInput, LyricKind, LyricSummary } from '~/types/lyric'
import type { Revision } from '~/types/revision'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { LYRIC_FORMATS, LYRIC_KINDS } from '~/types/lyric'

const props = defineProps<{ trackId: number, lyric: Lyric | null, originals: LyricSummary[] }>()
const emit = defineEmits<{ saved: [{ revision: Revision, lyric: Lyric | null }], cancel: [] }>()

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

const { t } = useI18n()
const kindOptions = computed<UiSelectOption<LyricKind>[]>(() => LYRIC_KINDS.map(kind => ({ value: kind, label: enumLabel('lyric_kind', kind), disabled: kind === 'original' && hasOtherOriginal.value })))
const formatOptions = computed<UiSelectOption<LyricFormat>[]>(() => LYRIC_FORMATS.map(format => ({ value: format, label: t(`lyrics_ui.format_${format}`) })))
const originalOptions = computed<UiSelectOption<number | null>[]>(() => [
  { value: null, label: '—' },
  ...props.originals.map(original => ({ value: original.id, label: localeName(original.language) })),
])

const saving = ref(false)
const errorMessage = ref('')
const tried = ref(false)

const submit = async () => {
  tried.value = true
  if (!form.language) return
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
      : await $api<{ revision: Revision, lyric: Lyric | null }>(`/v1/tracks/${props.trackId}/lyrics`, { method: 'POST', body })
    emit('saved', result)
  } catch (err) {
    errorMessage.value = localizeError(err)
  } finally {
    saving.value = false
  }
}
</script>
