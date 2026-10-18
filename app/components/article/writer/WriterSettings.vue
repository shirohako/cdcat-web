<script setup lang="ts">
import type { ArticleType, ContentLinkSummary, TagSummary } from '~/types/article'

/** The article's metadata: type, tags, summary, cover, links and custom link path. */
const props = withDefaults(defineProps<{ disabled?: boolean, allowStaffTags?: boolean, errors?: Record<string, string> }>(),
  { disabled: false, allowStaffTags: false, errors: () => ({}) })
const type = defineModel<ArticleType | null>('type', { required: true })
const summary = defineModel<string>('summary', { required: true })
const coverUrl = defineModel<string>('coverUrl', { required: true })
const slug = defineModel<string>('slug', { required: true })
const links = defineModel<ContentLinkSummary[]>('links', { required: true })
const tags = defineModel<TagSummary[]>('tags', { required: true })
const { t } = useI18n()
const { types, typeName } = useArticleTypes()
// A type deactivated since it was picked stays visible while selected; it can only go live on an article that already had it.
const typeOptions = computed(() => types.value.filter(item => item.is_active || item.key === type.value))
const coverBroken = ref(false)
watch(coverUrl, () => { coverBroken.value = false })
const coverIsHttps = computed(() => !coverUrl.value.trim() || /^https:\/\/\S+$/i.test(coverUrl.value.trim()))
const label = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'
const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-400 disabled:bg-slate-50'
const errorText = (key: string) => props.errors[key]
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-2">
      <span :class="label">{{ t('article_ui.fields.type') }} <span class="text-rose-500">*</span></span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="option in typeOptions" :key="option.key" type="button" :disabled="disabled"
          class="rounded-lg border px-2.5 py-1.5 text-left text-sm transition disabled:opacity-60"
          :class="type === option.key ? 'border-violet-400 bg-violet-50 font-semibold text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
          :aria-pressed="type === option.key" @click="type = option.key">
          {{ typeName(option.key) }}
        </button>
      </div>
      <p v-if="errorText('type')" class="text-xs text-rose-600">{{ errorText('type') }}</p>
    </section>

    <section class="space-y-2">
      <span :class="label">{{ t('article_ui.fields.tags') }}</span>
      <CommonTagPicker v-model="tags" :disabled="disabled" :allow-staff="allowStaffTags" />
      <p v-if="errorText('tag_ids')" class="text-xs text-rose-600">{{ errorText('tag_ids') }}</p>
    </section>

    <section class="space-y-2">
      <label :class="label" for="writer-summary">{{ t('article_ui.fields.summary') }}</label>
      <textarea
        id="writer-summary" v-model="summary" rows="3" maxlength="200" :disabled="disabled" :class="[field, 'resize-none']"
        :placeholder="t('article_ui.fields.summary_placeholder')" />
      <p class="flex justify-between text-[11px] text-slate-400">
        <span>{{ t('article_ui.fields.summary_hint') }}</span><span class="tabular-nums">{{ summary.length }}/200</span>
      </p>
    </section>

    <section class="space-y-2">
      <label :class="label" for="writer-cover">{{ t('article_ui.fields.cover') }}</label>
      <input id="writer-cover" v-model="coverUrl" type="url" inputmode="url" maxlength="500" :disabled="disabled" :class="field" placeholder="https://…">
      <p v-if="!coverIsHttps || errorText('cover_url')" class="text-xs text-rose-600">{{ errorText('cover_url') || t('article_ui.fields.cover_https') }}</p>
      <div v-else-if="coverUrl.trim()" class="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <img v-if="!coverBroken" :src="coverUrl.trim()" :alt="t('article_ui.fields.cover_preview')" class="size-full object-cover" referrerpolicy="no-referrer" @error="coverBroken = true">
        <p v-else class="grid size-full place-items-center text-xs text-slate-400">{{ t('article_ui.fields.cover_broken') }}</p>
      </div>
    </section>

    <section class="space-y-2">
      <span :class="label">{{ t('article_ui.fields.links') }}</span>
      <p class="text-[11px] text-slate-400">{{ t('article_ui.fields.links_hint') }}</p>
      <CommonContentLinkPicker v-model="links" :disabled="disabled" />
      <p v-if="errorText('links')" class="text-xs text-rose-600">{{ errorText('links') }}</p>
    </section>

    <details class="group rounded-lg border border-slate-200 bg-white">
      <summary class="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-slate-500">{{ t('article_ui.fields.advanced') }}</summary>
      <div class="space-y-2 border-t border-slate-100 p-3">
        <label :class="label" for="writer-slug">{{ t('article_ui.fields.slug') }}</label>
        <input id="writer-slug" v-model="slug" maxlength="100" :disabled="disabled" :class="[field, 'font-mono']" placeholder="my-article">
        <p class="text-[11px] text-slate-400">{{ t('article_ui.fields.slug_hint') }}</p>
        <p v-if="errorText('slug')" class="text-xs text-rose-600">{{ errorText('slug') }}</p>
      </div>
    </details>
  </div>
</template>
